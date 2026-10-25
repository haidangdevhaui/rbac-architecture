package com.enterprise.backend.gateway.presentation.filter;

import com.enterprise.backend.security.constant.SecurityHeaderConstants;
import com.enterprise.backend.security.dto.IntrospectResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Presentation Layer Inbound Security Filter:
 * Validates JWT Bearer tokens by introspecting against auth-rbac-service (with Redis caching),
 * performs coarse-grained role authorization, and injects trusted internal headers.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenIntrospectionFilter implements GlobalFilter, Ordered {

    private final WebClient.Builder webClientBuilder;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${security.auth-service.introspect-url:http://localhost:8081/internal/v1/auth/introspect}")
    private String introspectUrl;

    @Value("${security.cache.ttl-seconds:120}")
    private long cacheTtlSeconds;

    @Value("${security.public-paths:/api/v1/auth/**,/actuator/**,/error}")
    private List<String> publicPaths;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 0. Bypass preflight OPTIONS requests for CORS
        if (org.springframework.http.HttpMethod.OPTIONS.equals(request.getMethod())) {
            return chain.filter(exchange);
        }

        // 1. Whitelist Check
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 2. Extract Bearer Token
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Bearer token is empty");
        }

        String tokenHash = hashToken(token);
        String cacheKey = "auth:token:" + tokenHash;

        // 3. Introspection via Redis Cache or auth-rbac-service WebClient
        return redisTemplate.opsForValue().get(cacheKey)
                .flatMap(cachedJson -> {
                    try {
                        IntrospectResponse response = objectMapper.readValue(cachedJson, IntrospectResponse.class);
                        return Mono.just(response);
                    } catch (Exception e) {
                        return Mono.empty();
                    }
                })
                .switchIfEmpty(
                        callAuthRbacService(token)
                                .flatMap(response -> {
                                    if (response.isActive()) {
                                        try {
                                            String json = objectMapper.writeValueAsString(response);
                                            return redisTemplate.opsForValue()
                                                    .set(cacheKey, json, Duration.ofSeconds(cacheTtlSeconds))
                                                    .thenReturn(response);
                                        } catch (JsonProcessingException e) {
                                            log.error("Failed to serialize IntrospectResponse for cache", e);
                                        }
                                    }
                                    return Mono.just(response);
                                })
                )
                .flatMap(introspect -> {
                    if (!introspect.isActive()) {
                        return onError(exchange, HttpStatus.UNAUTHORIZED,
                                introspect.getErrorMessage() != null ? introspect.getErrorMessage() : "Token inactive or expired");
                    }

                    // 4. Coarse-Grained Authorization Check
                    if (!isCoarseAuthorized(path, introspect)) {
                        return onError(exchange, HttpStatus.FORBIDDEN,
                                "Access denied: insufficient coarse privileges for admin endpoint");
                    }

                    // 5. Inject Internal Headers & Correlation ID
                    String correlationId = request.getHeaders().getFirst(SecurityHeaderConstants.HEADER_CORRELATION_ID);
                    if (!StringUtils.hasText(correlationId)) {
                        correlationId = UUID.randomUUID().toString();
                    }

                    String rolesHeader = introspect.getRoles() != null ? String.join(",", introspect.getRoles()) : "";
                    String permsHeader = introspect.getPermissions() != null ? String.join(",", introspect.getPermissions()) : "";

                    ServerHttpRequest mutatedRequest = request.mutate()
                            .header(SecurityHeaderConstants.HEADER_INTERNAL_USER_ID, String.valueOf(introspect.getInternalUserId()))
                            .header(SecurityHeaderConstants.HEADER_USER_CODE, introspect.getUserCode() != null ? introspect.getUserCode() : "")
                            .header(SecurityHeaderConstants.HEADER_USERNAME, introspect.getUsername() != null ? introspect.getUsername() : "")
                            .header(SecurityHeaderConstants.HEADER_USER_EMAIL, introspect.getEmail() != null ? introspect.getEmail() : "")
                            .header(SecurityHeaderConstants.HEADER_USER_ROLES, rolesHeader)
                            .header(SecurityHeaderConstants.HEADER_USER_PERMISSIONS, permsHeader)
                            .header(SecurityHeaderConstants.HEADER_IDP_PROVIDER, introspect.getProvider() != null ? introspect.getProvider() : "")
                            .header(SecurityHeaderConstants.HEADER_EXTERNAL_USER_ID, introspect.getExternalUserId() != null ? introspect.getExternalUserId() : "")
                            .header(SecurityHeaderConstants.HEADER_CORRELATION_ID, correlationId)
                            .build();

                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                })
                .onErrorResume(e -> {
                    log.error("Error during token introspection: {}", e.getMessage(), e);
                    return onError(exchange, HttpStatus.UNAUTHORIZED, "Authentication service unavailable or error: " + e.getMessage());
                });
    }

    private Mono<IntrospectResponse> callAuthRbacService(String token) {
        return webClientBuilder.build()
                .post()
                .uri(introspectUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("token", token))
                .retrieve()
                .bodyToMono(IntrospectResponse.class)
                .onErrorResume(ex -> {
                    log.error("Failed to call auth-rbac-service introspect: {}", ex.getMessage());
                    return Mono.just(IntrospectResponse.builder()
                            .active(false)
                            .errorMessage("Failed to introspect token with auth-rbac-service")
                            .build());
                });
    }

    private boolean isPublicPath(String path) {
        if (publicPaths == null) {
            return false;
        }
        for (String pattern : publicPaths) {
            if (pathMatcher.match(pattern.trim(), path)) {
                return true;
            }
        }
        return false;
    }

    private boolean isCoarseAuthorized(String path, IntrospectResponse introspect) {
        List<String> roles = introspect.getRoles();
        if (roles == null || roles.isEmpty()) {
            return false;
        }

        if (roles.contains("ROLE_ADMIN") || roles.contains("ROLE_SUPER_ADMIN")) {
            return true;
        }

        if (path.startsWith("/api/v1/inventory/")) {
            return roles.contains("ROLE_INVENTORY_ADMIN") || roles.contains("ROLE_INVENTORY_MANAGER");
        }

        if (path.startsWith("/api/v1/orders/")) {
            return roles.contains("ROLE_ORDER_ADMIN") || roles.contains("ROLE_ORDER_MANAGER");
        }

        return true;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(token.hashCode());
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String json = String.format("{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                java.time.Instant.now(), status.value(), status.getReasonPhrase(), message, exchange.getRequest().getURI().getPath());

        DataBuffer buffer = response.bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}

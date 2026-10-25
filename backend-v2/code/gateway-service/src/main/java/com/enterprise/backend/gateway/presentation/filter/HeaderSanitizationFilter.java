package com.enterprise.backend.gateway.presentation.filter;

import com.enterprise.backend.security.constant.SecurityHeaderConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Presentation Layer Inbound Filter:
 * Strips any incoming headers from external clients that match internal prefix (X-Internal-*, X-User-*).
 * This prevents header spoofing / injection attacks from untrusted external traffic.
 */
@Slf4j
@Component
public class HeaderSanitizationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        List<String> headersToRemove = request.getHeaders().keySet().stream()
                .filter(headerName -> headerName.regionMatches(true, 0, SecurityHeaderConstants.INTERNAL_HEADER_PREFIX, 0, SecurityHeaderConstants.INTERNAL_HEADER_PREFIX.length())
                        || headerName.regionMatches(true, 0, SecurityHeaderConstants.USER_HEADER_PREFIX, 0, SecurityHeaderConstants.USER_HEADER_PREFIX.length())
                        || headerName.equalsIgnoreCase(SecurityHeaderConstants.HEADER_IDP_PROVIDER)
                        || headerName.equalsIgnoreCase(SecurityHeaderConstants.HEADER_EXTERNAL_USER_ID))
                .collect(Collectors.toList());

        if (!headersToRemove.isEmpty()) {
            log.warn("Blocked potentially spoofed client headers: {}", headersToRemove);
            ServerHttpRequest.Builder requestBuilder = request.mutate();
            for (String header : headersToRemove) {
                requestBuilder.headers(httpHeaders -> httpHeaders.remove(header));
            }
            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

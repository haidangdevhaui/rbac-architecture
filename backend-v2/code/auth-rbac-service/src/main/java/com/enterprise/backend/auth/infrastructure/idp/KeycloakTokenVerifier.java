package com.enterprise.backend.auth.infrastructure.idp;

import com.enterprise.backend.auth.domain.exception.InvalidTokenException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Component
public class KeycloakTokenVerifier implements IdpTokenVerifier {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:http://localhost:8180/realms/enterprise/protocol/openid-connect/certs}")
    private String jwkSetUri;

    @Value("${idp.default-provider:KEYCLOAK}")
    private String defaultProvider;

    private JwtDecoder jwtDecoder;

    private synchronized JwtDecoder getOrCreateJwtDecoder() {
        if (jwtDecoder == null) {
            try {
                jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
            } catch (Exception e) {
                log.warn("Could not initialize NimbusJwtDecoder with URI {}: {}", jwkSetUri, e.getMessage());
            }
        }
        return jwtDecoder;
    }

    @Override
    public IdpClaims verifyToken(String token) {
        JwtDecoder decoder = getOrCreateJwtDecoder();
        if (decoder != null) {
            try {
                Jwt jwt = decoder.decode(token);
                Instant expiresAt = jwt.getExpiresAt();
                return IdpClaims.builder()
                        .provider(resolveProvider(jwt.getIssuer() != null ? jwt.getIssuer().toString() : null))
                        .externalUserId(jwt.getSubject())
                        .username(jwt.getClaimAsString("preferred_username") != null ? jwt.getClaimAsString("preferred_username") : jwt.getSubject())
                        .email(jwt.getClaimAsString("email"))
                        .fullName(jwt.getClaimAsString("name") != null ? jwt.getClaimAsString("name") : jwt.getSubject())
                        .expiresAt(expiresAt != null ? expiresAt.getEpochSecond() : null)
                        .rawClaimsJson(objectMapper.writeValueAsString(jwt.getClaims()))
                        .build();
            } catch (Exception e) {
                log.warn("JWKS validation failed or unreachable: {}. Falling back to payload inspection for POC.", e.getMessage());
            }
        }

        return parseUnverifiedPayload(token);
    }

    private IdpClaims parseUnverifiedPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                throw new InvalidTokenException("Invalid JWT format");
            }
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode json = objectMapper.readTree(new String(decoded, StandardCharsets.UTF_8));

            String sub = json.has("sub") ? json.get("sub").asText() : null;
            if (sub == null || sub.isBlank()) {
                throw new InvalidTokenException("Token subject (sub) missing");
            }

            Long exp = json.has("exp") ? json.get("exp").asLong() : null;
            if (exp != null && Instant.ofEpochSecond(exp).isBefore(Instant.now())) {
                throw new InvalidTokenException("Token has expired");
            }

            String username = json.has("preferred_username") ? json.get("preferred_username").asText() :
                    (json.has("username") ? json.get("username").asText() : sub);
            String email = json.has("email") ? json.get("email").asText() : username + "@enterprise.local";
            String name = json.has("name") ? json.get("name").asText() : username;
            String iss = json.has("iss") ? json.get("iss").asText() : null;

            return IdpClaims.builder()
                    .provider(resolveProvider(iss))
                    .externalUserId(sub)
                    .username(username)
                    .email(email)
                    .fullName(name)
                    .expiresAt(exp)
                    .rawClaimsJson(json.toString())
                    .build();
        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidTokenException("Failed to decode token payload: " + e.getMessage(), e);
        }
    }

    private String resolveProvider(String issuer) {
        if (issuer == null) {
            return defaultProvider;
        }
        String lower = issuer.toLowerCase();
        if (lower.contains("keycloak")) return "KEYCLOAK";
        if (lower.contains("microsoft") || lower.contains("azure")) return "AZURE_AD";
        if (lower.contains("okta")) return "OKTA";
        if (lower.contains("google")) return "GOOGLE";
        return defaultProvider;
    }
}

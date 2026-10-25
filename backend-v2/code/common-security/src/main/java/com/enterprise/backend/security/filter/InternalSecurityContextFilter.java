package com.enterprise.backend.security.filter;

import com.enterprise.backend.security.constant.SecurityHeaderConstants;
import com.enterprise.backend.security.context.UserContext;
import com.enterprise.backend.security.context.UserContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filter executed in downstream microservices (inventory-service, order-service).
 * Parses trusted X-Internal-* headers injected by gateway-service and populates
 * Spring Security's SecurityContextHolder and UserContextHolder.
 */
@Slf4j
public class InternalSecurityContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userIdStr = request.getHeader(SecurityHeaderConstants.HEADER_INTERNAL_USER_ID);

        if (StringUtils.hasText(userIdStr)) {
            try {
                Long internalUserId = Long.parseLong(userIdStr);
                String userCode = request.getHeader(SecurityHeaderConstants.HEADER_USER_CODE);
                String username = request.getHeader(SecurityHeaderConstants.HEADER_USERNAME);
                String email = request.getHeader(SecurityHeaderConstants.HEADER_USER_EMAIL);
                String provider = request.getHeader(SecurityHeaderConstants.HEADER_IDP_PROVIDER);
                String externalUserId = request.getHeader(SecurityHeaderConstants.HEADER_EXTERNAL_USER_ID);

                // Parse roles and permissions
                String rolesHeader = request.getHeader(SecurityHeaderConstants.HEADER_USER_ROLES);
                List<String> roles = parseCommaSeparated(rolesHeader);

                String permsHeader = request.getHeader(SecurityHeaderConstants.HEADER_USER_PERMISSIONS);
                List<String> permissions = parseCommaSeparated(permsHeader);

                // Build UserContext
                UserContext userContext = UserContext.builder()
                        .internalUserId(internalUserId)
                        .userCode(userCode)
                        .username(username)
                        .email(email)
                        .provider(provider)
                        .externalUserId(externalUserId)
                        .roles(roles)
                        .permissions(permissions)
                        .build();

                UserContextHolder.setContext(userContext);

                // Build Spring Security Authorities (both roles and fine-grained permissions)
                List<GrantedAuthority> authorities = new ArrayList<>();
                for (String role : roles) {
                    authorities.add(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
                }
                for (String perm : permissions) {
                    authorities.add(new SimpleGrantedAuthority(perm));
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userContext, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                log.error("Failed to parse internal user context headers: {}", e.getMessage(), e);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private List<String> parseCommaSeparated(String header) {
        if (!StringUtils.hasText(header)) {
            return List.of();
        }
        return Arrays.stream(header.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}

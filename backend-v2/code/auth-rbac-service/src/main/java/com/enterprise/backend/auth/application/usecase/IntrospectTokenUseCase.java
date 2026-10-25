package com.enterprise.backend.auth.application.usecase;

import com.enterprise.backend.auth.domain.exception.UserSuspendedException;
import com.enterprise.backend.auth.domain.model.InternalUser;
import com.enterprise.backend.auth.domain.model.Permission;
import com.enterprise.backend.auth.domain.model.Role;
import com.enterprise.backend.auth.domain.service.UserProvisioningDomainService;
import com.enterprise.backend.auth.infrastructure.idp.IdpClaims;
import com.enterprise.backend.auth.infrastructure.idp.IdpTokenVerifier;
import com.enterprise.backend.security.dto.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntrospectTokenUseCase {

    private final IdpTokenVerifier tokenVerifier;
    private final UserProvisioningDomainService userProvisioningDomainService;

    @Value("${idp.auto-provisioning.default-role:ROLE_ADMIN}")
    private String defaultRoleCode;

    @Transactional
    public IntrospectResponse execute(String token) {
        if (token == null || token.isBlank()) {
            return IntrospectResponse.builder()
                    .active(false)
                    .errorMessage("Token cannot be blank")
                    .build();
        }

        IdpClaims claims;
        try {
            claims = tokenVerifier.verifyToken(token);
        } catch (Exception e) {
            log.warn("Token verification rejected: {}", e.getMessage());
            return IntrospectResponse.builder()
                    .active(false)
                    .errorMessage(e.getMessage())
                    .build();
        }

        try {
            InternalUser user = userProvisioningDomainService.resolveOrProvisionUser(
                    claims.getProvider(),
                    claims.getExternalUserId(),
                    claims.getUsername(),
                    claims.getEmail(),
                    claims.getFullName(),
                    claims.getRawClaimsJson(),
                    defaultRoleCode
            );

            if (!user.isActive()) {
                throw new UserSuspendedException("Internal user account is suspended or deleted");
            }

            List<String> roles = user.getRoles().stream()
                    .map(Role::getCode)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<String> permissions = user.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getCode)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            return IntrospectResponse.builder()
                    .active(true)
                    .internalUserId(user.getId())
                    .userCode(user.getUserCode())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .provider(claims.getProvider())
                    .externalUserId(claims.getExternalUserId())
                    .roles(roles)
                    .permissions(permissions)
                    .expiresAt(claims.getExpiresAt())
                    .build();

        } catch (UserSuspendedException e) {
            return IntrospectResponse.builder()
                    .active(false)
                    .errorMessage(e.getMessage())
                    .build();
        } catch (Exception e) {
            log.error("Error during introspection orchestration: {}", e.getMessage(), e);
            return IntrospectResponse.builder()
                    .active(false)
                    .errorMessage("Internal server error resolving user privileges: " + e.getMessage())
                    .build();
        }
    }
}

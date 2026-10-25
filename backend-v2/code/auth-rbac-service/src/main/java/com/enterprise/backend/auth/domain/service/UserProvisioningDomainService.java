package com.enterprise.backend.auth.domain.service;

import com.enterprise.backend.auth.domain.model.ExternalUser;
import com.enterprise.backend.auth.domain.model.InternalUser;
import com.enterprise.backend.auth.domain.model.Role;
import com.enterprise.backend.auth.domain.model.UserStatus;
import com.enterprise.backend.auth.domain.repository.ExternalUserRepository;
import com.enterprise.backend.auth.domain.repository.InternalUserRepository;
import com.enterprise.backend.auth.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProvisioningDomainService {

    private final InternalUserRepository internalUserRepository;
    private final ExternalUserRepository externalUserRepository;
    private final RoleRepository roleRepository;

    /**
     * Resolves an existing internal user or provisions a new one (JIT Provisioning).
     */
    public InternalUser resolveOrProvisionUser(String provider,
                                              String externalUserId,
                                              String username,
                                              String email,
                                              String fullName,
                                              String idpMetadata,
                                              String defaultRoleCode) {

        Optional<ExternalUser> existingExternal = externalUserRepository
                .findByProviderAndExternalUserId(provider, externalUserId);

        if (existingExternal.isPresent()) {
            ExternalUser externalUser = existingExternal.get();
            externalUser.updateLoginTimestamp(idpMetadata);
            externalUserRepository.save(externalUser);
            log.info("Found existing user mapping: provider={}, externalId={}, internalUserId={}",
                    provider, externalUserId, externalUser.getInternalUser().getId());
            return externalUser.getInternalUser();
        }

        log.info("Provisioning new JIT user for provider={}, externalId={}", provider, externalUserId);

        // Account linking: check if an internal user with same email exists
        InternalUser internalUser = null;
        if (email != null && !email.isBlank()) {
            internalUser = internalUserRepository.findByEmail(email).orElse(null);
        }

        if (internalUser == null) {
            String userCode = "USR-" + (System.currentTimeMillis() % 1000000);
            String effectiveUsername = (username != null && !username.isBlank()) ? username : "user_" + UUID.randomUUID().toString().substring(0, 8);

            if (internalUserRepository.findByUsername(effectiveUsername).isPresent()) {
                effectiveUsername = effectiveUsername + "_" + (System.currentTimeMillis() % 1000);
            }

            internalUser = InternalUser.builder()
                    .userCode(userCode)
                    .username(effectiveUsername)
                    .email(email != null ? email : effectiveUsername + "@enterprise.local")
                    .fullName(fullName != null ? fullName : effectiveUsername)
                    .status(UserStatus.ACTIVE.name())
                    .isDeleted(false)
                    .build();

            // Assign initial default role
            Role defaultRole = roleRepository.findByCode(defaultRoleCode)
                    .orElseGet(() -> roleRepository.findByCode("ROLE_ADMIN").orElse(null));
            if (defaultRole != null) {
                internalUser.setRoles(Set.of(defaultRole));
            }

            internalUser = internalUserRepository.save(internalUser);
            log.info("Created new InternalUser: id={}, userCode={}", internalUser.getId(), internalUser.getUserCode());
        }

        ExternalUser newExternalUser = ExternalUser.builder()
                .internalUser(internalUser)
                .provider(provider)
                .externalUserId(externalUserId)
                .externalUsername(username)
                .externalEmail(email)
                .idpMetadata(idpMetadata)
                .build();
        newExternalUser.updateLoginTimestamp(idpMetadata);

        externalUserRepository.save(newExternalUser);
        log.info("Linked ExternalUser to InternalUser id={}", internalUser.getId());

        return internalUser;
    }
}

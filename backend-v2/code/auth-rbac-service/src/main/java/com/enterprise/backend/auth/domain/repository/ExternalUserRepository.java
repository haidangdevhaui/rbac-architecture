package com.enterprise.backend.auth.domain.repository;

import com.enterprise.backend.auth.domain.model.ExternalUser;

import java.util.Optional;

public interface ExternalUserRepository {

    Optional<ExternalUser> findByProviderAndExternalUserId(String provider, String externalUserId);

    ExternalUser save(ExternalUser externalUser);
}

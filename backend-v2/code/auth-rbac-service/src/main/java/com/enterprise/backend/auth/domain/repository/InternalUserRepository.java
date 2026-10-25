package com.enterprise.backend.auth.domain.repository;

import com.enterprise.backend.auth.domain.model.InternalUser;

import java.util.Optional;

public interface InternalUserRepository {

    Optional<InternalUser> findById(Long id);

    Optional<InternalUser> findByUsername(String username);

    Optional<InternalUser> findByEmail(String email);

    Optional<InternalUser> findByUserCode(String userCode);

    InternalUser save(InternalUser user);
}

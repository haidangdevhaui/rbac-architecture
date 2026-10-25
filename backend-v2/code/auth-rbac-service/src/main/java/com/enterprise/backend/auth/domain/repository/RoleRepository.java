package com.enterprise.backend.auth.domain.repository;

import com.enterprise.backend.auth.domain.model.Role;

import java.util.Optional;

public interface RoleRepository {

    Optional<Role> findByCode(String code);

    Role save(Role role);
}

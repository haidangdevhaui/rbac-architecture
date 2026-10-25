package com.enterprise.backend.auth.infrastructure.persistence.repository;

import com.enterprise.backend.auth.domain.model.Role;
import com.enterprise.backend.auth.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
interface SpringDataRoleJpaRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCode(String code);
}

@Component
@RequiredArgsConstructor
public class RoleRepositoryImpl implements RoleRepository {

    private final SpringDataRoleJpaRepository jpaRepository;

    @Override
    public Optional<Role> findByCode(String code) {
        return jpaRepository.findByCode(code);
    }

    @Override
    public Role save(Role role) {
        return jpaRepository.save(role);
    }
}

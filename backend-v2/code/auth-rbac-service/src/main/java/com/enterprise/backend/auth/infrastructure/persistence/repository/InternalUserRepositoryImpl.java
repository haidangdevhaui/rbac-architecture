package com.enterprise.backend.auth.infrastructure.persistence.repository;

import com.enterprise.backend.auth.domain.model.InternalUser;
import com.enterprise.backend.auth.domain.repository.InternalUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
interface SpringDataInternalUserJpaRepository extends JpaRepository<InternalUser, Long> {
    Optional<InternalUser> findByUsername(String username);
    Optional<InternalUser> findByEmail(String email);
    Optional<InternalUser> findByUserCode(String userCode);
}

@Component
@RequiredArgsConstructor
public class InternalUserRepositoryImpl implements InternalUserRepository {

    private final SpringDataInternalUserJpaRepository jpaRepository;

    @Override
    public Optional<InternalUser> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<InternalUser> findByUsername(String username) {
        return jpaRepository.findByUsername(username);
    }

    @Override
    public Optional<InternalUser> findByEmail(String email) {
        return jpaRepository.findByEmail(email);
    }

    @Override
    public Optional<InternalUser> findByUserCode(String userCode) {
        return jpaRepository.findByUserCode(userCode);
    }

    @Override
    public InternalUser save(InternalUser user) {
        return jpaRepository.save(user);
    }
}

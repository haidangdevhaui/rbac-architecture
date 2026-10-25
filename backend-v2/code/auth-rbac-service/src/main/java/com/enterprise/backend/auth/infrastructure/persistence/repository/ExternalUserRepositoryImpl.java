package com.enterprise.backend.auth.infrastructure.persistence.repository;

import com.enterprise.backend.auth.domain.model.ExternalUser;
import com.enterprise.backend.auth.domain.repository.ExternalUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
interface SpringDataExternalUserJpaRepository extends JpaRepository<ExternalUser, Long> {
    @Query("SELECT e FROM ExternalUser e JOIN FETCH e.internalUser u LEFT JOIN FETCH u.roles r LEFT JOIN FETCH r.permissions WHERE e.provider = :provider AND e.externalUserId = :externalUserId")
    Optional<ExternalUser> findByProviderAndExternalUserIdWithDetails(@Param("provider") String provider,
                                                                     @Param("externalUserId") String externalUserId);
}

@Component
@RequiredArgsConstructor
public class ExternalUserRepositoryImpl implements ExternalUserRepository {

    private final SpringDataExternalUserJpaRepository jpaRepository;

    @Override
    public Optional<ExternalUser> findByProviderAndExternalUserId(String provider, String externalUserId) {
        return jpaRepository.findByProviderAndExternalUserIdWithDetails(provider, externalUserId);
    }

    @Override
    public ExternalUser save(ExternalUser externalUser) {
        return jpaRepository.save(externalUser);
    }
}

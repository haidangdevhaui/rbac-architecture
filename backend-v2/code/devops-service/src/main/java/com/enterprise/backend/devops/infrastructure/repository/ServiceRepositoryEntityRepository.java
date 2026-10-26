package com.enterprise.backend.devops.infrastructure.repository;

import com.enterprise.backend.devops.domain.model.ServiceRepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceRepositoryEntityRepository extends JpaRepository<ServiceRepositoryEntity, Long> {
    Optional<ServiceRepositoryEntity> findByServiceId(Long serviceId);
}

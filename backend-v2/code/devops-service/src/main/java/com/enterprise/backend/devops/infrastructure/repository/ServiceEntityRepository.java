package com.enterprise.backend.devops.infrastructure.repository;

import com.enterprise.backend.devops.domain.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, Long> {

    Optional<ServiceEntity> findByServiceCode(String serviceCode);

    boolean existsByServiceCode(String serviceCode);

    @Query("SELECT s FROM ServiceEntity s LEFT JOIN FETCH s.repository ORDER BY s.id DESC")
    List<ServiceEntity> findAllWithRepository();
}

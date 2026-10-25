package com.enterprise.backend.inventory.infrastructure.persistence.repository;

import com.enterprise.backend.inventory.domain.model.Warehouse;
import com.enterprise.backend.inventory.domain.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface SpringDataWarehouseJpaRepository extends JpaRepository<Warehouse, Long> {
    Optional<Warehouse> findByCode(String code);
}

@Component
@RequiredArgsConstructor
public class WarehouseRepositoryImpl implements WarehouseRepository {

    private final SpringDataWarehouseJpaRepository jpaRepository;

    @Override
    public List<Warehouse> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public Optional<Warehouse> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<Warehouse> findByCode(String code) {
        return jpaRepository.findByCode(code);
    }

    @Override
    public Warehouse save(Warehouse warehouse) {
        return jpaRepository.save(warehouse);
    }
}

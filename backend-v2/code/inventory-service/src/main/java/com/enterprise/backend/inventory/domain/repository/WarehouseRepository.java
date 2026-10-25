package com.enterprise.backend.inventory.domain.repository;

import com.enterprise.backend.inventory.domain.model.Warehouse;

import java.util.List;
import java.util.Optional;

public interface WarehouseRepository {
    List<Warehouse> findAll();
    Optional<Warehouse> findById(Long id);
    Optional<Warehouse> findByCode(String code);
    Warehouse save(Warehouse warehouse);
}

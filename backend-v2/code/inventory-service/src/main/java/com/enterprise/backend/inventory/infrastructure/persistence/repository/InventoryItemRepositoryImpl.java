package com.enterprise.backend.inventory.infrastructure.persistence.repository;

import com.enterprise.backend.inventory.domain.model.InventoryItem;
import com.enterprise.backend.inventory.domain.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface SpringDataInventoryItemJpaRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByWarehouseId(Long warehouseId);
    Optional<InventoryItem> findByWarehouseIdAndSku(Long warehouseId, String sku);
}

@Component
@RequiredArgsConstructor
public class InventoryItemRepositoryImpl implements InventoryItemRepository {

    private final SpringDataInventoryItemJpaRepository jpaRepository;

    @Override
    public List<InventoryItem> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public List<InventoryItem> findByWarehouseId(Long warehouseId) {
        return jpaRepository.findByWarehouseId(warehouseId);
    }

    @Override
    public Optional<InventoryItem> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<InventoryItem> findByWarehouseIdAndSku(Long warehouseId, String sku) {
        return jpaRepository.findByWarehouseIdAndSku(warehouseId, sku);
    }

    @Override
    public InventoryItem save(InventoryItem item) {
        return jpaRepository.save(item);
    }
}

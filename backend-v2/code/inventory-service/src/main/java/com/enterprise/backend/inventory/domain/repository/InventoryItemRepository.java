package com.enterprise.backend.inventory.domain.repository;

import com.enterprise.backend.inventory.domain.model.InventoryItem;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository {
    List<InventoryItem> findAll();
    List<InventoryItem> findByWarehouseId(Long warehouseId);
    Optional<InventoryItem> findById(Long id);
    Optional<InventoryItem> findByWarehouseIdAndSku(Long warehouseId, String sku);
    InventoryItem save(InventoryItem item);
}

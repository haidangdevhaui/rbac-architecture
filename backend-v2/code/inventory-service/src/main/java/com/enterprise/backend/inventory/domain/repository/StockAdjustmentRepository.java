package com.enterprise.backend.inventory.domain.repository;

import com.enterprise.backend.inventory.domain.model.StockAdjustment;

import java.util.List;

public interface StockAdjustmentRepository {
    StockAdjustment save(StockAdjustment adjustment);
    List<StockAdjustment> findByWarehouseId(Long warehouseId);
}

package com.enterprise.backend.inventory.infrastructure.persistence.repository;

import com.enterprise.backend.inventory.domain.model.StockAdjustment;
import com.enterprise.backend.inventory.domain.repository.StockAdjustmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
interface SpringDataStockAdjustmentJpaRepository extends JpaRepository<StockAdjustment, Long> {
    List<StockAdjustment> findByWarehouseIdOrderByAdjustedAtDesc(Long warehouseId);
}

@Component
@RequiredArgsConstructor
public class StockAdjustmentRepositoryImpl implements StockAdjustmentRepository {

    private final SpringDataStockAdjustmentJpaRepository jpaRepository;

    @Override
    public StockAdjustment save(StockAdjustment adjustment) {
        return jpaRepository.save(adjustment);
    }

    @Override
    public List<StockAdjustment> findByWarehouseId(Long warehouseId) {
        return jpaRepository.findByWarehouseIdOrderByAdjustedAtDesc(warehouseId);
    }
}

package com.enterprise.backend.inventory.application.usecase;

import com.enterprise.backend.inventory.domain.model.InventoryItem;
import com.enterprise.backend.inventory.domain.model.Warehouse;
import com.enterprise.backend.inventory.domain.repository.InventoryItemRepository;
import com.enterprise.backend.inventory.domain.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetInventoryUseCase {

    private final WarehouseRepository warehouseRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Transactional(readOnly = true)
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<InventoryItem> getStocks(Long warehouseId) {
        if (warehouseId != null) {
            return inventoryItemRepository.findByWarehouseId(warehouseId);
        }
        return inventoryItemRepository.findAll();
    }
}

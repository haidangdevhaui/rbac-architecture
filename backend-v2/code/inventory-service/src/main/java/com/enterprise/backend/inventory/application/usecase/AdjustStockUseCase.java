package com.enterprise.backend.inventory.application.usecase;

import com.enterprise.backend.inventory.application.dto.AdjustStockCommand;
import com.enterprise.backend.inventory.domain.exception.InventoryItemNotFoundException;
import com.enterprise.backend.inventory.domain.model.InventoryItem;
import com.enterprise.backend.inventory.domain.model.StockAdjustment;
import com.enterprise.backend.inventory.domain.repository.InventoryItemRepository;
import com.enterprise.backend.inventory.domain.repository.StockAdjustmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdjustStockUseCase {

    private final InventoryItemRepository inventoryItemRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;

    @Transactional
    public InventoryItem execute(AdjustStockCommand command) {
        log.info("Executing AdjustStockUseCase: warehouseId={}, sku={}, change={}, adjustedBy={}",
                command.getWarehouseId(), command.getSku(), command.getQuantityChange(), command.getAdjustedBy());

        InventoryItem item = inventoryItemRepository
                .findByWarehouseIdAndSku(command.getWarehouseId(), command.getSku())
                .orElseThrow(() -> new InventoryItemNotFoundException(
                        String.format("Inventory item with SKU '%s' not found in warehouse %d", command.getSku(), command.getWarehouseId())
                ));

        // Invoke domain aggregate method (enforces business invariant)
        StockAdjustment adjustment = item.adjustStock(
                command.getQuantityChange(),
                command.getReason(),
                command.getAdjustedBy()
        );

        inventoryItemRepository.save(item);
        stockAdjustmentRepository.save(adjustment);

        return item;
    }
}

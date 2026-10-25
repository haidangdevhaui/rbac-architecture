package com.enterprise.backend.inventory.presentation.rest;

import com.enterprise.backend.inventory.application.dto.AdjustStockCommand;
import com.enterprise.backend.inventory.application.usecase.AdjustStockUseCase;
import com.enterprise.backend.inventory.application.usecase.GetInventoryUseCase;
import com.enterprise.backend.inventory.domain.model.InventoryItem;
import com.enterprise.backend.inventory.domain.model.Warehouse;
import com.enterprise.backend.inventory.presentation.dto.AdjustStockApiRequest;
import com.enterprise.backend.security.annotation.CurrentUser;
import com.enterprise.backend.security.context.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final GetInventoryUseCase getInventoryUseCase;
    private final AdjustStockUseCase adjustStockUseCase;

    @GetMapping("/warehouses")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_ADMIN') or hasAuthority('inventory:read')")
    public ResponseEntity<List<Warehouse>> getWarehouses() {
        return ResponseEntity.ok(getInventoryUseCase.getAllWarehouses());
    }

    @GetMapping("/stocks")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_ADMIN') or hasAuthority('inventory:read')")
    public ResponseEntity<List<InventoryItem>> getStocks(@RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        return ResponseEntity.ok(getInventoryUseCase.getStocks(warehouseId));
    }

    @PostMapping("/stocks/adjust")
    @PreAuthorize("hasAuthority('inventory:stock:adjust')")
    public ResponseEntity<InventoryItem> adjustStock(@Valid @RequestBody AdjustStockApiRequest request,
                                                    @CurrentUser UserContext currentUser) {
        Long internalUserId = currentUser != null ? currentUser.getInternalUserId() : null;

        AdjustStockCommand command = AdjustStockCommand.builder()
                .warehouseId(request.getWarehouseId())
                .sku(request.getSku())
                .quantityChange(request.getQuantityChange())
                .reason(request.getReason())
                .adjustedBy(internalUserId)
                .build();

        InventoryItem updatedItem = adjustStockUseCase.execute(command);
        return ResponseEntity.ok(updatedItem);
    }
}

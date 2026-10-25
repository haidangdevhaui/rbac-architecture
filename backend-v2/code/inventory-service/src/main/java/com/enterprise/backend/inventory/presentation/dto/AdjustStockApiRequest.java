package com.enterprise.backend.inventory.presentation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustStockApiRequest {

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    @NotNull(message = "SKU is required")
    private String sku;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    private String reason;
}

package com.enterprise.backend.inventory.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustStockCommand {
    private Long warehouseId;
    private String sku;
    private Integer quantityChange;
    private String reason;
    private Long adjustedBy;
}

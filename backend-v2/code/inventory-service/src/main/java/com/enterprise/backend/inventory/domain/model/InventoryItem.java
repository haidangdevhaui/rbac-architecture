package com.enterprise.backend.inventory.domain.model;

import com.enterprise.backend.inventory.domain.exception.InsufficientStockException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "inventory_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouse_sku", columnNames = {"warehouse_id", "sku"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, length = 100)
    private String sku;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Integer reservedQuantity = 0;

    @Column(name = "min_stock_threshold")
    @Builder.Default
    private Integer minStockThreshold = 10;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // Domain Invariants & Aggregate Logic
    public StockAdjustment adjustStock(int change, String reason, Long adjustedBy) {
        int previousQty = this.quantity;
        int newQty = previousQty + change;

        if (newQty < 0) {
            throw new InsufficientStockException(
                    String.format("Cannot adjust stock for SKU %s by %d: remaining stock cannot be negative (current: %d)",
                            this.sku, change, previousQty)
            );
        }

        this.quantity = newQty;

        return StockAdjustment.builder()
                .itemId(this.id)
                .warehouseId(this.warehouse.getId())
                .quantityChange(change)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .reason(reason)
                .adjustedBy(adjustedBy != null ? adjustedBy : 0L)
                .build();
    }

    public boolean isLowStock() {
        return this.quantity <= this.minStockThreshold;
    }
}

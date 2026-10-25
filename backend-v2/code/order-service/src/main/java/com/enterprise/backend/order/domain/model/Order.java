package com.enterprise.backend.order.domain.model;

import com.enterprise.backend.order.domain.exception.InvalidOrderStateException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "customer_name", nullable = false, length = 255)
    private String customerName;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "VND";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING_APPROVAL";

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // Domain Invariants & Aggregate Root Methods
    public OrderApprovalLog approve(Long approverId, String comment) {
        if (!OrderStatus.PENDING_APPROVAL.name().equalsIgnoreCase(this.status)) {
            throw new InvalidOrderStateException(
                    String.format("Order '%s' cannot be approved because current status is '%s'. Only PENDING_APPROVAL orders can be approved.",
                            this.orderCode, this.status)
            );
        }

        this.status = OrderStatus.APPROVED.name();

        return OrderApprovalLog.builder()
                .orderId(this.id)
                .action("APPROVE")
                .comment(comment != null ? comment : "Approved by administrator")
                .performedBy(approverId != null ? approverId : 0L)
                .build();
    }

    public OrderApprovalLog cancel(Long cancellerId, String reason) {
        if (OrderStatus.CANCELLED.name().equalsIgnoreCase(this.status)) {
            throw new InvalidOrderStateException(
                    String.format("Order '%s' is already CANCELLED.", this.orderCode)
            );
        }

        this.status = OrderStatus.CANCELLED.name();

        return OrderApprovalLog.builder()
                .orderId(this.id)
                .action("CANCEL")
                .comment(reason != null ? reason : "Cancelled by administrator")
                .performedBy(cancellerId != null ? cancellerId : 0L)
                .build();
    }
}

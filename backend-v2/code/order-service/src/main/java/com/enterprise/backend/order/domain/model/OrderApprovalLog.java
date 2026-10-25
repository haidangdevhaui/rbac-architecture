package com.enterprise.backend.order.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "order_approval_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class OrderApprovalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 30)
    private String action; // APPROVE, REJECT, CANCEL

    @Column(length = 500)
    private String comment;

    @Column(name = "performed_by", nullable = false)
    private Long performedBy; // internalUserId

    @CreationTimestamp
    @Column(name = "performed_at", updatable = false)
    private OffsetDateTime performedAt;
}

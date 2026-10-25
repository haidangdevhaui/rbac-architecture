package com.enterprise.backend.order.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderCommand {
    private Long orderId;
    private String reason;
    private Long cancellerId;
}

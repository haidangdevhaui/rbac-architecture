package com.enterprise.backend.order.domain.repository;

import com.enterprise.backend.order.domain.model.OrderApprovalLog;

import java.util.List;

public interface OrderApprovalLogRepository {
    OrderApprovalLog save(OrderApprovalLog log);
    List<OrderApprovalLog> findByOrderId(Long orderId);
}

package com.enterprise.backend.order.presentation.rest;

import com.enterprise.backend.order.application.dto.ApproveOrderCommand;
import com.enterprise.backend.order.application.dto.CancelOrderCommand;
import com.enterprise.backend.order.application.usecase.ApproveOrderUseCase;
import com.enterprise.backend.order.application.usecase.CancelOrderUseCase;
import com.enterprise.backend.order.application.usecase.GetOrdersUseCase;
import com.enterprise.backend.order.domain.model.Order;
import com.enterprise.backend.order.presentation.dto.ApprovalDecisionApiRequest;
import com.enterprise.backend.security.annotation.CurrentUser;
import com.enterprise.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final GetOrdersUseCase getOrdersUseCase;
    private final ApproveOrderUseCase approveOrderUseCase;
    private final CancelOrderUseCase cancelOrderUseCase;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORDER_ADMIN') or hasAuthority('order:read')")
    public ResponseEntity<List<Order>> getOrders(@RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(getOrdersUseCase.getOrders(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORDER_ADMIN') or hasAuthority('order:read')")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(getOrdersUseCase.getOrderById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('order:approve')")
    public ResponseEntity<Order> approveOrder(@PathVariable Long id,
                                              @RequestBody(required = false) ApprovalDecisionApiRequest request,
                                              @CurrentUser UserContext currentUser) {
        Long internalUserId = currentUser != null ? currentUser.getInternalUserId() : null;
        String comment = request != null ? request.getComment() : null;

        ApproveOrderCommand command = ApproveOrderCommand.builder()
                .orderId(id)
                .comment(comment)
                .approverId(internalUserId)
                .build();

        Order approvedOrder = approveOrderUseCase.execute(command);
        return ResponseEntity.ok(approvedOrder);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('order:cancel')")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id,
                                             @RequestBody(required = false) ApprovalDecisionApiRequest request,
                                             @CurrentUser UserContext currentUser) {
        Long internalUserId = currentUser != null ? currentUser.getInternalUserId() : null;
        String reason = request != null ? request.getComment() : null;

        CancelOrderCommand command = CancelOrderCommand.builder()
                .orderId(id)
                .reason(reason)
                .cancellerId(internalUserId)
                .build();

        Order cancelledOrder = cancelOrderUseCase.execute(command);
        return ResponseEntity.ok(cancelledOrder);
    }
}

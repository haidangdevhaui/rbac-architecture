package com.enterprise.backend.order.application.usecase;

import com.enterprise.backend.order.application.dto.CancelOrderCommand;
import com.enterprise.backend.order.domain.exception.OrderNotFoundException;
import com.enterprise.backend.order.domain.model.Order;
import com.enterprise.backend.order.domain.model.OrderApprovalLog;
import com.enterprise.backend.order.domain.repository.OrderApprovalLogRepository;
import com.enterprise.backend.order.domain.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CancelOrderUseCase {

    private final OrderRepository orderRepository;
    private final OrderApprovalLogRepository orderApprovalLogRepository;

    @Transactional
    public Order execute(CancelOrderCommand command) {
        log.info("Executing CancelOrderUseCase: orderId={}, cancellerId={}",
                command.getOrderId(), command.getCancellerId());

        Order order = orderRepository.findById(command.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + command.getOrderId()));

        // Invoke domain aggregate method (enforces state transition invariant)
        OrderApprovalLog logEntry = order.cancel(command.getCancellerId(), command.getReason());

        orderRepository.save(order);
        orderApprovalLogRepository.save(logEntry);

        return order;
    }
}

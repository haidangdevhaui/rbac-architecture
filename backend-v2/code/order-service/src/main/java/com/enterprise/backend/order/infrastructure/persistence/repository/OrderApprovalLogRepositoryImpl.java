package com.enterprise.backend.order.infrastructure.persistence.repository;

import com.enterprise.backend.order.domain.model.OrderApprovalLog;
import com.enterprise.backend.order.domain.repository.OrderApprovalLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
interface SpringDataOrderApprovalLogJpaRepository extends JpaRepository<OrderApprovalLog, Long> {
    List<OrderApprovalLog> findByOrderIdOrderByPerformedAtDesc(Long orderId);
}

@Component
@RequiredArgsConstructor
public class OrderApprovalLogRepositoryImpl implements OrderApprovalLogRepository {

    private final SpringDataOrderApprovalLogJpaRepository jpaRepository;

    @Override
    public OrderApprovalLog save(OrderApprovalLog log) {
        return jpaRepository.save(log);
    }

    @Override
    public List<OrderApprovalLog> findByOrderId(Long orderId) {
        return jpaRepository.findByOrderIdOrderByPerformedAtDesc(orderId);
    }
}

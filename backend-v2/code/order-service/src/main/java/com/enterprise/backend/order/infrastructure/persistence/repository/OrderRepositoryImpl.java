package com.enterprise.backend.order.infrastructure.persistence.repository;

import com.enterprise.backend.order.domain.model.Order;
import com.enterprise.backend.order.domain.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface SpringDataOrderJpaRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByStatusOrderByCreatedAtDesc(String status);
}

@Component
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {

    private final SpringDataOrderJpaRepository jpaRepository;

    @Override
    public List<Order> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public List<Order> findByStatus(String status) {
        return jpaRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
    }

    @Override
    public Optional<Order> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<Order> findByOrderCode(String orderCode) {
        return jpaRepository.findByOrderCode(orderCode);
    }

    @Override
    public Order save(Order order) {
        return jpaRepository.save(order);
    }
}

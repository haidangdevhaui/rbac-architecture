package com.enterprise.backend.order.domain.repository;

import com.enterprise.backend.order.domain.model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository {
    List<Order> findAll();
    List<Order> findByStatus(String status);
    Optional<Order> findById(Long id);
    Optional<Order> findByOrderCode(String orderCode);
    Order save(Order order);
}

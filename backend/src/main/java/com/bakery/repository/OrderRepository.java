package com.bakery.repository;

import com.bakery.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByOrderStatus(Integer orderStatus);
    List<Order> findByRiderIdAndOrderStatusIn(Long riderId, List<Integer> statuses);
}

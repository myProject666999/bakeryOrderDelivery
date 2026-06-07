package com.bakery.repository;

import com.bakery.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByProductId(Long productId);
    List<Feedback> findByOrderId(Long orderId);
    List<Feedback> findByCustomerId(Long customerId);
}

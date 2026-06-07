package com.bakery.repository;

import com.bakery.entity.DeliveryTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryTaskRepository extends JpaRepository<DeliveryTask, Long> {
    Optional<DeliveryTask> findByOrderId(Long orderId);
    List<DeliveryTask> findByRiderId(Long riderId);
    List<DeliveryTask> findByRiderIdAndTaskStatus(Long riderId, Integer taskStatus);
}

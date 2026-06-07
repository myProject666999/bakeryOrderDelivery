package com.bakery.service;

import com.bakery.common.BusinessException;
import com.bakery.entity.DeliveryTask;
import com.bakery.entity.Order;
import com.bakery.entity.Rider;
import com.bakery.repository.DeliveryTaskRepository;
import com.bakery.repository.OrderRepository;
import com.bakery.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryTaskRepository deliveryTaskRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RiderRepository riderRepository;

    public List<Rider> getAvailableRiders() {
        return riderRepository.findByStatus(1);
    }

    public Rider getRiderById(Long id) {
        return riderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("骑手不存在"));
    }

    public Rider createRider(Rider rider) {
        return riderRepository.save(rider);
    }

    public Rider updateRiderStatus(Long id, Integer status) {
        Rider rider = getRiderById(id);
        rider.setStatus(status);
        return riderRepository.save(rider);
    }

    @Transactional
    public List<DeliveryTask> assignDeliveryToRider(Long riderId, List<Long> orderIds) {
        Rider rider = getRiderById(riderId);
        if (rider.getStatus() != 1) {
            throw new BusinessException("骑手当前不可用");
        }

        List<DeliveryTask> tasks = new ArrayList<>();
        int sequence = 1;

        for (Long orderId : orderIds) {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("订单不存在"));
            
            if (order.getDeliveryType() != 1) {
                throw new BusinessException("订单[" + order.getOrderNo() + "]不是配送订单");
            }
            
            if (order.getOrderStatus() != 1) {
                throw new BusinessException("订单[" + order.getOrderNo() + "]状态不正确");
            }

            deliveryTaskRepository.findByOrderId(orderId).ifPresent(t -> {
                throw new BusinessException("订单[" + order.getOrderNo() + "]已分配配送任务");
            });

            DeliveryTask task = new DeliveryTask();
            task.setOrderId(orderId);
            task.setRiderId(riderId);
            task.setTaskStatus(0);
            task.setDeliverySequence(sequence++);
            task.setEstimatedArrivalTime(calculateEstimatedArrival(sequence));
            tasks.add(deliveryTaskRepository.save(task));

            order.setOrderStatus(3);
            order.setRiderId(riderId);
            orderRepository.save(order);
        }

        rider.setStatus(2);
        riderRepository.save(rider);

        return tasks;
    }

    public DeliveryTask updateTaskStatus(Long taskId, Integer status) {
        DeliveryTask task = deliveryTaskRepository.findById(taskId)
            .orElseThrow(() -> new BusinessException("配送任务不存在"));
        
        task.setTaskStatus(status);
        
        if (status == 2) {
            task.setActualArrivalTime(LocalDateTime.now());
            Order order = orderRepository.findById(task.getOrderId()).orElseThrow();
            order.setOrderStatus(4);
            orderRepository.save(order);
            
            List<DeliveryTask> riderTasks = deliveryTaskRepository
                .findByRiderIdAndTaskStatus(task.getRiderId(), 0);
            riderTasks.addAll(deliveryTaskRepository
                .findByRiderIdAndTaskStatus(task.getRiderId(), 1));
            if (riderTasks.isEmpty()) {
                Rider rider = riderRepository.findById(task.getRiderId()).orElseThrow();
                rider.setStatus(1);
                riderRepository.save(rider);
            }
        }
        
        return deliveryTaskRepository.save(task);
    }

    public List<DeliveryTask> getRiderTasks(Long riderId) {
        return deliveryTaskRepository.findByRiderId(riderId);
    }

    public Map<Long, List<Order>> groupOrdersByAddress(List<Long> orderIds) {
        Map<Long, List<Order>> addressGroups = new HashMap<>();
        
        for (Long orderId : orderIds) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getDeliveryAddress() != null) {
                String address = order.getDeliveryAddress();
                Long groupKey = (long) (address.hashCode() & 0xfffffff);
                addressGroups.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(order);
            }
        }
        
        return addressGroups;
    }

    private LocalDateTime calculateEstimatedArrival(int sequence) {
        return LocalDateTime.now().plusMinutes(30L * sequence);
    }

    public List<DeliveryTask> getPendingTasks() {
        return deliveryTaskRepository.findAll().stream()
            .filter(t -> t.getTaskStatus() < 2)
            .collect(Collectors.toList());
    }
}

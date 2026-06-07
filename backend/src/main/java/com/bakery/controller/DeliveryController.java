package com.bakery.controller;

import com.bakery.common.Result;
import com.bakery.dto.DeliveryAssignRequest;
import com.bakery.entity.DeliveryTask;
import com.bakery.entity.Order;
import com.bakery.entity.Rider;
import com.bakery.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/delivery")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    @GetMapping("/riders/available")
    public Result<List<Rider>> getAvailableRiders() {
        return Result.success(deliveryService.getAvailableRiders());
    }

    @GetMapping("/riders/{id}")
    public Result<Rider> getRiderById(@PathVariable Long id) {
        return Result.success(deliveryService.getRiderById(id));
    }

    @PostMapping("/riders")
    public Result<Rider> createRider(@RequestBody Rider rider) {
        return Result.success(deliveryService.createRider(rider));
    }

    @PutMapping("/riders/{id}/status")
    public Result<Rider> updateRiderStatus(@PathVariable Long id, @RequestParam Integer status) {
        return Result.success(deliveryService.updateRiderStatus(id, status));
    }

    @PostMapping("/assign")
    public Result<List<DeliveryTask>> assignDelivery(@RequestBody DeliveryAssignRequest request) {
        return Result.success(deliveryService.assignDeliveryToRider(request.getRiderId(), request.getOrderIds()));
    }

    @PutMapping("/tasks/{taskId}/status")
    public Result<DeliveryTask> updateTaskStatus(@PathVariable Long taskId, @RequestParam Integer status) {
        return Result.success(deliveryService.updateTaskStatus(taskId, status));
    }

    @GetMapping("/riders/{riderId}/tasks")
    public Result<List<DeliveryTask>> getRiderTasks(@PathVariable Long riderId) {
        return Result.success(deliveryService.getRiderTasks(riderId));
    }

    @PostMapping("/group")
    public Result<Map<Long, List<Order>>> groupOrders(@RequestBody List<Long> orderIds) {
        return Result.success(deliveryService.groupOrdersByAddress(orderIds));
    }

    @GetMapping("/tasks/pending")
    public Result<List<DeliveryTask>> getPendingTasks() {
        return Result.success(deliveryService.getPendingTasks());
    }
}

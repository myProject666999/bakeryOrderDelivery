package com.bakery.controller;

import com.bakery.common.Result;
import com.bakery.dto.OrderRequest;
import com.bakery.entity.Order;
import com.bakery.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public Result<Order> createOrder(@RequestBody OrderRequest request) {
        return Result.success(orderService.createOrder(request));
    }

    @GetMapping("/{id}")
    public Result<Order> getOrderById(@PathVariable Long id) {
        return Result.success(orderService.getOrderById(id));
    }

    @GetMapping("/no/{orderNo}")
    public Result<Order> getOrderByNo(@PathVariable String orderNo) {
        return Result.success(orderService.getOrderByNo(orderNo));
    }

    @GetMapping("/customer/{customerId}")
    public Result<List<Order>> getOrdersByCustomer(@PathVariable Long customerId) {
        return Result.success(orderService.getOrdersByCustomer(customerId));
    }

    @GetMapping("/status/{status}")
    public Result<List<Order>> getOrdersByStatus(@PathVariable Integer status) {
        return Result.success(orderService.getOrdersByStatus(status));
    }

    @PutMapping("/{id}/status")
    public Result<Order> updateOrderStatus(@PathVariable Long id, @RequestParam Integer status) {
        return Result.success(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/{id}/cancel")
    public Result<Void> cancelOrder(@PathVariable Long id) {
        orderService.cancelOrder(id);
        return Result.success();
    }
}

package com.bakery.service;

import com.bakery.common.BusinessException;
import com.bakery.dto.OrderItemRequest;
import com.bakery.dto.OrderRequest;
import com.bakery.entity.*;
import com.bakery.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InventoryService inventoryService;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Customer customer = getOrCreateCustomer(request);

        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                .orElseThrow(() -> new BusinessException("商品不存在"));

            Integer remaining = inventoryService.getRemainingQuantity(itemRequest.getProductId());
            if (remaining < itemRequest.getQuantity()) {
                throw new BusinessException("商品[" + product.getName() + "]库存不足，剩余" + remaining + "个");
            }

            if (!inventoryService.canPlaceCustomOrder(product, request.getDeliveryTime())) {
                throw new BusinessException("定制商品[" + product.getName() + "]需要提前" + 
                    product.getLeadTimeHours() + "小时下单");
            }
        }

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setCustomerId(customer.getId());
        order.setDeliveryType(request.getDeliveryType());
        order.setDeliveryAddress(request.getDeliveryAddress() != null ? 
            request.getDeliveryAddress() : customer.getAddress());
        order.setDeliveryTime(request.getDeliveryTime());
        order.setRemark(request.getRemark());
        order.setOrderStatus(0);
        order.setTotalAmount(request.getTotalAmount() != null ? 
            request.getTotalAmount() : calculateTotal(request.getItems()));
        order = orderRepository.save(order);

        List<Long> deductedProducts = new ArrayList<>();
        try {
            for (OrderItemRequest itemRequest : request.getItems()) {
                Product product = productRepository.findById(itemRequest.getProductId()).orElseThrow(() -> new BusinessException("商品不存在"));
                
                boolean success = inventoryService.deductInventory(itemRequest.getProductId(), itemRequest.getQuantity());
                if (!success) {
                    throw new BusinessException("商品[" + product.getName() + "]库存扣减失败");
                }
                deductedProducts.add(itemRequest.getProductId());

                OrderItem item = new OrderItem();
                item.setOrderId(order.getId());
                item.setProductId(product.getId());
                item.setQuantity(itemRequest.getQuantity());
                item.setUnitPrice(product.getPrice());
                item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
                item.setCustomRequirements(itemRequest.getCustomRequirements());
                orderItemRepository.save(item);
                order.getOrderItems().add(item);
            }
        } catch (Exception e) {
            for (Long productId : deductedProducts) {
                inventoryService.restoreInventory(productId, 
                    request.getItems().stream()
                        .filter(i -> i.getProductId().equals(productId))
                        .findFirst()
                        .map(OrderItemRequest::getQuantity)
                        .orElse(1));
            }
            throw e;
        }

        return order;
    }

    private Customer getOrCreateCustomer(OrderRequest request) {
        if (request.getCustomerId() != null) {
            return customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new BusinessException("客户不存在"));
        }
        
        if (request.getCustomerPhone() != null) {
            return customerRepository.findByPhone(request.getCustomerPhone())
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setName(request.getCustomerName());
                    newCustomer.setPhone(request.getCustomerPhone());
                    newCustomer.setAddress(request.getCustomerAddress());
                    return customerRepository.save(newCustomer);
                });
        }
        
        throw new BusinessException("客户信息不能为空");
    }

    private BigDecimal calculateTotal(List<OrderItemRequest> items) {
        return items.stream()
            .map(item -> {
                Product product = productRepository.findById(item.getProductId()).orElseThrow(() -> new BusinessException("商品不存在"));
                return product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "BK" + timestamp + uuid;
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    public Order getOrderByNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo)
            .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    public List<Order> getOrdersByStatus(Integer status) {
        return orderRepository.findByOrderStatus(status);
    }

    @Transactional
    public Order updateOrderStatus(Long id, Integer status) {
        Order order = getOrderById(id);
        order.setOrderStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public void cancelOrder(Long id) {
        Order order = getOrderById(id);
        if (order.getOrderStatus() >= 2) {
            throw new BusinessException("订单已开始制作，无法取消");
        }
        
        List<OrderItem> items = orderItemRepository.findByOrderId(id);
        for (OrderItem item : items) {
            inventoryService.restoreInventory(item.getProductId(), item.getQuantity());
        }
        
        order.setOrderStatus(5);
        orderRepository.save(order);
    }
}

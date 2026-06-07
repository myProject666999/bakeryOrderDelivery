package com.bakery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderRequest {
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private Integer deliveryType;
    private String deliveryAddress;
    private LocalDateTime deliveryTime;
    private String remark;
    private List<OrderItemRequest> items;
    private BigDecimal totalAmount;
}

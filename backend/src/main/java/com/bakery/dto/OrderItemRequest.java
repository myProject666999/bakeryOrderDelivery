package com.bakery.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemRequest {
    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String customRequirements;
}

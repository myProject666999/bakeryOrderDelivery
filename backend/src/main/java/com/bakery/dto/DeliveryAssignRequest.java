package com.bakery.dto;

import lombok.Data;

import java.util.List;

@Data
public class DeliveryAssignRequest {
    private Long riderId;
    private List<Long> orderIds;
}

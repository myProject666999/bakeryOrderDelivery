package com.bakery.dto;

import lombok.Data;

@Data
public class FeedbackRequest {
    private Long orderId;
    private Long customerId;
    private Long productId;
    private Integer tasteRating;
    private Integer satisfactionRating;
    private String comment;
}

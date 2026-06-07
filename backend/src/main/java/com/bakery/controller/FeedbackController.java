package com.bakery.controller;

import com.bakery.common.Result;
import com.bakery.dto.FeedbackRequest;
import com.bakery.entity.Feedback;
import com.bakery.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feedbacks")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public Result<Feedback> createFeedback(@RequestBody FeedbackRequest request) {
        return Result.success(feedbackService.createFeedback(request));
    }

    @GetMapping("/product/{productId}")
    public Result<List<Feedback>> getFeedbacksByProduct(@PathVariable Long productId) {
        return Result.success(feedbackService.getFeedbacksByProduct(productId));
    }

    @GetMapping("/order/{orderId}")
    public Result<List<Feedback>> getFeedbacksByOrder(@PathVariable Long orderId) {
        return Result.success(feedbackService.getFeedbacksByOrder(orderId));
    }

    @GetMapping("/customer/{customerId}")
    public Result<List<Feedback>> getFeedbacksByCustomer(@PathVariable Long customerId) {
        return Result.success(feedbackService.getFeedbacksByCustomer(customerId));
    }

    @GetMapping("/product/{productId}/stats")
    public Result<Map<String, Object>> getProductFeedbackStats(@PathVariable Long productId) {
        return Result.success(feedbackService.getProductFeedbackStats(productId));
    }
}

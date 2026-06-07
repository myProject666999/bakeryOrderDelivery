package com.bakery.service;

import com.bakery.common.BusinessException;
import com.bakery.dto.FeedbackRequest;
import com.bakery.entity.Feedback;
import com.bakery.entity.Order;
import com.bakery.repository.FeedbackRepository;
import com.bakery.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Feedback createFeedback(FeedbackRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
            .orElseThrow(() -> new BusinessException("订单不存在"));
        
        if (order.getOrderStatus() != 4) {
            throw new BusinessException("订单未完成，无法提交反馈");
        }

        if (!order.getCustomerId().equals(request.getCustomerId())) {
            throw new BusinessException("只能反馈自己的订单");
        }

        Feedback feedback = new Feedback();
        feedback.setOrderId(request.getOrderId());
        feedback.setCustomerId(request.getCustomerId());
        feedback.setProductId(request.getProductId());
        feedback.setTasteRating(request.getTasteRating());
        feedback.setSatisfactionRating(request.getSatisfactionRating());
        feedback.setComment(request.getComment());
        
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getFeedbacksByProduct(Long productId) {
        return feedbackRepository.findByProductId(productId);
    }

    public List<Feedback> getFeedbacksByOrder(Long orderId) {
        return feedbackRepository.findByOrderId(orderId);
    }

    public List<Feedback> getFeedbacksByCustomer(Long customerId) {
        return feedbackRepository.findByCustomerId(customerId);
    }

    public Map<String, Object> getProductFeedbackStats(Long productId) {
        List<Feedback> feedbacks = feedbackRepository.findByProductId(productId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", feedbacks.size());
        
        OptionalDouble tasteAvg = feedbacks.stream()
            .filter(f -> f.getTasteRating() != null)
            .mapToInt(Feedback::getTasteRating)
            .average();
        stats.put("averageTasteRating", tasteAvg.orElse(0.0));
        
        OptionalDouble satisfactionAvg = feedbacks.stream()
            .filter(f -> f.getSatisfactionRating() != null)
            .mapToInt(Feedback::getSatisfactionRating)
            .average();
        stats.put("averageSatisfactionRating", satisfactionAvg.orElse(0.0));
        
        Map<Integer, Long> tasteDistribution = feedbacks.stream()
            .filter(f -> f.getTasteRating() != null)
            .collect(java.util.stream.Collectors.groupingBy(
                Feedback::getTasteRating,
                java.util.stream.Collectors.counting()
            ));
        stats.put("tasteDistribution", tasteDistribution);
        
        return stats;
    }
}

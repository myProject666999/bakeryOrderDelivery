package com.bakery.service;

import com.bakery.common.BusinessException;
import com.bakery.entity.DailyInventory;
import com.bakery.entity.Product;
import com.bakery.repository.DailyInventoryRepository;
import com.bakery.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class InventoryService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DailyInventoryRepository dailyInventoryRepository;

    @Value("${bakery.daily-inventory.key-prefix:bakery:inventory:}")
    private String keyPrefix;

    @Value("${bakery.daily-inventory.close-hour:18}")
    private Integer closeHour;

    private final DefaultRedisScript<Long> deductScript = new DefaultRedisScript<>(
        "local key = KEYS[1] " +
        "local quantity = tonumber(ARGV[1]) " +
        "local current = tonumber(redis.call('get', key) or '0') " +
        "if current >= quantity then " +
        "    redis.call('decrby', key, quantity) " +
        "    return current - quantity " +
        "else " +
        "    return -1 " +
        "end",
        Long.class
    );

    public String getInventoryKey(Long productId, LocalDate date) {
        return keyPrefix + productId + ":" + date.toString();
    }

    public void initializeDailyInventory(Long productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new BusinessException("商品不存在"));
        
        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        Boolean exists = redisTemplate.hasKey(key);
        if (Boolean.FALSE.equals(exists)) {
            redisTemplate.opsForValue().set(key, product.getDailyCapacity(), 24, TimeUnit.HOURS);
            
            DailyInventory inventory = dailyInventoryRepository
                .findByProductIdAndInventoryDate(productId, today)
                .orElse(new DailyInventory());
            inventory.setProductId(productId);
            inventory.setInventoryDate(today);
            inventory.setTotalCapacity(product.getDailyCapacity());
            inventory.setRemainingQuantity(product.getDailyCapacity());
            dailyInventoryRepository.save(inventory);
        }
    }

    public Integer getRemainingQuantity(Long productId) {
        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            initializeDailyInventory(productId);
            value = redisTemplate.opsForValue().get(key);
        }
        return value != null ? Integer.parseInt(value.toString()) : 0;
    }

    public boolean deductInventory(Long productId, int quantity) {
        if (!isOrderAllowed()) {
            throw new BusinessException("今日已关单，请明日再下单");
        }

        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        Long remaining = redisTemplate.execute(deductScript, Collections.singletonList(key), String.valueOf(quantity));
        
        if (remaining == null || remaining < 0) {
            return false;
        }
        
        DailyInventory inventory = dailyInventoryRepository
            .findByProductIdAndInventoryDate(productId, today)
            .orElse(null);
        if (inventory != null) {
            inventory.setRemainingQuantity(remaining.intValue());
            dailyInventoryRepository.save(inventory);
        }
        
        return true;
    }

    public void restoreInventory(Long productId, int quantity) {
        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        redisTemplate.opsForValue().increment(key, quantity);
        
        DailyInventory inventory = dailyInventoryRepository
            .findByProductIdAndInventoryDate(productId, today)
            .orElse(null);
        if (inventory != null) {
            inventory.setRemainingQuantity(inventory.getRemainingQuantity() + quantity);
            dailyInventoryRepository.save(inventory);
        }
    }

    public boolean isOrderAllowed() {
        LocalTime now = LocalTime.now();
        return now.getHour() < closeHour;
    }

    public boolean canPlaceCustomOrder(Product product, LocalDateTime deliveryTime) {
        if (!product.getIsCustomizable()) {
            return true;
        }
        
        LocalDateTime earliestTime = LocalDateTime.now().plusHours(product.getLeadTimeHours());
        return deliveryTime != null && deliveryTime.isAfter(earliestTime);
    }

    public void syncInventoryToDB() {
        LocalDate today = LocalDate.now();
        productRepository.findAll().forEach(product -> {
            String key = getInventoryKey(product.getId(), today);
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                int remaining = Integer.parseInt(value.toString());
                DailyInventory inventory = dailyInventoryRepository
                    .findByProductIdAndInventoryDate(product.getId(), today)
                    .orElse(null);
                if (inventory != null) {
                    inventory.setRemainingQuantity(remaining);
                    dailyInventoryRepository.save(inventory);
                }
            }
        });
    }
}

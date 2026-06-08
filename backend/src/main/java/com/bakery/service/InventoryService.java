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
        "local stock_value = redis.call('get', key) " +
        "local current = 0 " +
        "if stock_value ~= false then " +
        "    current = tonumber(stock_value) " +
        "end " +
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
        
        boolean needInit = true;
        try {
            Boolean exists = redisTemplate.hasKey(key);
            if (Boolean.TRUE.equals(exists)) {
                needInit = false;
            }
        } catch (Exception e) {
            log.warn("检查Redis库存key异常，直接从数据库初始化", e);
        }
        
        if (needInit) {
            try {
                redisTemplate.opsForValue().set(key, product.getDailyCapacity(), 24, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("设置Redis库存失败", e);
            }
            
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
        
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return Integer.parseInt(value.toString());
            }
        } catch (Exception e) {
            log.warn("从Redis获取库存失败，尝试从数据库获取", e);
        }
        
        DailyInventory inventory = dailyInventoryRepository
            .findByProductIdAndInventoryDate(productId, today)
            .orElse(null);
        if (inventory != null) {
            return inventory.getRemainingQuantity();
        }
        
        initializeDailyInventory(productId);
        Product product = productRepository.findById(productId).orElse(null);
        return product != null ? product.getDailyCapacity() : 0;
    }

    public boolean deductInventory(Long productId, int quantity) {
        if (!isOrderAllowed()) {
            throw new BusinessException("今日已关单，请明日再下单");
        }

        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        try {
            Boolean hasKey = redisTemplate.hasKey(key);
            if (!Boolean.TRUE.equals(hasKey)) {
                initializeDailyInventory(productId);
            }
        } catch (Exception e) {
            log.warn("检查Redis库存key失败，尝试从数据库检查", e);
            DailyInventory inventory = dailyInventoryRepository
                .findByProductIdAndInventoryDate(productId, today)
                .orElse(null);
            if (inventory == null) {
                initializeDailyInventory(productId);
            }
        }
        
        Long remaining;
        try {
            remaining = redisTemplate.execute(deductScript, Collections.singletonList(key), String.valueOf(quantity));
        } catch (Exception e) {
            log.error("Redis扣减库存失败，尝试数据库扣减", e);
            return deductInventoryFromDB(productId, quantity, today);
        }
        
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
    
    private boolean deductInventoryFromDB(Long productId, int quantity, LocalDate today) {
        DailyInventory inventory = dailyInventoryRepository
            .findByProductIdAndInventoryDate(productId, today)
            .orElseThrow(() -> new BusinessException("库存不存在"));
        
        if (inventory.getRemainingQuantity() < quantity) {
            return false;
        }
        
        inventory.setRemainingQuantity(inventory.getRemainingQuantity() - quantity);
        dailyInventoryRepository.save(inventory);
        
        try {
            redisTemplate.opsForValue().set(getInventoryKey(productId, today), 
                inventory.getRemainingQuantity(), 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("同步数据库库存到Redis失败", e);
        }
        
        return true;
    }

    public void restoreInventory(Long productId, int quantity) {
        LocalDate today = LocalDate.now();
        String key = getInventoryKey(productId, today);
        
        try {
            Boolean hasKey = redisTemplate.hasKey(key);
            if (Boolean.TRUE.equals(hasKey)) {
                redisTemplate.opsForValue().increment(key, quantity);
            } else {
                initializeDailyInventory(productId);
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null) {
                    redisTemplate.opsForValue().set(key, product.getDailyCapacity() + quantity, 
                        24, TimeUnit.HOURS);
                }
            }
        } catch (Exception e) {
            log.warn("Redis恢复库存失败", e);
        }
        
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

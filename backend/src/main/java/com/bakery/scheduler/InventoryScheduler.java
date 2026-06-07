package com.bakery.scheduler;

import com.bakery.entity.Product;
import com.bakery.repository.ProductRepository;
import com.bakery.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class InventoryScheduler {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    @Scheduled(cron = "0 0 0 * * ?")
    public void initializeDailyInventory() {
        log.info("开始初始化当日库存...");
        List<Product> products = productRepository.findByStatus(true);
        for (Product product : products) {
            try {
                inventoryService.initializeDailyInventory(product.getId());
                log.info("商品[{}]当日库存初始化完成，产能: {}", product.getName(), product.getDailyCapacity());
            } catch (Exception e) {
                log.error("商品[{}]当日库存初始化失败", product.getName(), e);
            }
        }
        log.info("当日库存初始化完成");
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void syncInventoryToDB() {
        log.debug("同步Redis库存到数据库...");
        inventoryService.syncInventoryToDB();
    }
}

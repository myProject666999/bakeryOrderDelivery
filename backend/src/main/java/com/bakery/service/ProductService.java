package com.bakery.service;

import com.bakery.common.BusinessException;
import com.bakery.entity.Product;
import com.bakery.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryService inventoryService;

    public List<Product> getAllProducts() {
        return productRepository.findByStatus(true);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
            .filter(Product::getStatus)
            .collect(Collectors.toList());
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new BusinessException("商品不存在"));
    }

    public Map<String, Object> getProductWithInventory(Long id) {
        Product product = getProductById(id);
        Integer remaining = inventoryService.getRemainingQuantity(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("product", product);
        result.put("remainingQuantity", remaining);
        result.put("orderAllowed", inventoryService.isOrderAllowed());
        return result;
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product product) {
        Product existing = getProductById(id);
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setCategory(product.getCategory());
        existing.setDailyCapacity(product.getDailyCapacity());
        existing.setIsCustomizable(product.getIsCustomizable());
        existing.setLeadTimeHours(product.getLeadTimeHours());
        existing.setImageUrl(product.getImageUrl());
        existing.setStatus(product.getStatus());
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setStatus(false);
        productRepository.save(product);
    }
}

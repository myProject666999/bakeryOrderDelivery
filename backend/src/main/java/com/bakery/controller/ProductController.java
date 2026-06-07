package com.bakery.controller;

import com.bakery.common.Result;
import com.bakery.entity.Product;
import com.bakery.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public Result<List<Product>> getAllProducts() {
        return Result.success(productService.getAllProducts());
    }

    @GetMapping("/category/{category}")
    public Result<List<Product>> getProductsByCategory(@PathVariable String category) {
        return Result.success(productService.getProductsByCategory(category));
    }

    @GetMapping("/{id}")
    public Result<Product> getProductById(@PathVariable Long id) {
        return Result.success(productService.getProductById(id));
    }

    @GetMapping("/{id}/inventory")
    public Result<Map<String, Object>> getProductWithInventory(@PathVariable Long id) {
        return Result.success(productService.getProductWithInventory(id));
    }

    @PostMapping
    public Result<Product> createProduct(@RequestBody Product product) {
        return Result.success(productService.createProduct(product));
    }

    @PutMapping("/{id}")
    public Result<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return Result.success(productService.updateProduct(id, product));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return Result.success();
    }
}

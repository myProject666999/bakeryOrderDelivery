package com.bakery.controller;

import com.bakery.common.Result;
import com.bakery.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/{productId}/remaining")
    public Result<Integer> getRemainingQuantity(@PathVariable Long productId) {
        return Result.success(inventoryService.getRemainingQuantity(productId));
    }

    @GetMapping("/allowed")
    public Result<Boolean> isOrderAllowed() {
        return Result.success(inventoryService.isOrderAllowed());
    }

    @PostMapping("/{productId}/init")
    public Result<Void> initializeInventory(@PathVariable Long productId) {
        inventoryService.initializeDailyInventory(productId);
        return Result.success();
    }

    @PostMapping("/sync")
    public Result<Void> syncInventory() {
        inventoryService.syncInventoryToDB();
        return Result.success();
    }
}

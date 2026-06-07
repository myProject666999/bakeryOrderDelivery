package com.bakery.repository;

import com.bakery.entity.DailyInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyInventoryRepository extends JpaRepository<DailyInventory, Long> {
    Optional<DailyInventory> findByProductIdAndInventoryDate(Long productId, LocalDate inventoryDate);
}

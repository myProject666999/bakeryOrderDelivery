package com.bakery.repository;

import com.bakery.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiderRepository extends JpaRepository<Rider, Long> {
    List<Rider> findByStatus(Integer status);
}

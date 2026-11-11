package com.project.printhubback.repository;

import com.project.printhubback.model.seller.StorePricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StorePricingRepo extends JpaRepository<StorePricing,Long> {

    Optional<StorePricing> findByStore_Id(Long storeId);

    boolean existsByStore_Id(Long storeId);
}

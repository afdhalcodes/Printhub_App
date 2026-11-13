package com.project.printhubback.repository;

import com.project.printhubback.model.seller.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepo extends JpaRepository<Store,Long> {

    List<Store> findAllBySeller_Id(Long sellerId);

    Optional<Store> findByIdAndSeller_Id(
            Long storeId,
            Long sellerId
    );

    // Buyer methods
    List<Store> findAllByActiveTrueOrderByNameAsc();

    Optional<Store> findByIdAndActiveTrue(Long storeId);
}

package com.project.printhubback.repository;

import com.project.printhubback.model.order.PrintOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrintOrderRepo extends JpaRepository<PrintOrder,Long> {

    List<PrintOrder> findAllByBuyer_IdOrderByCreatedAtDesc(
            Long buyerId
    );

    Optional<PrintOrder> findByIdAndBuyer_Id(
            Long orderId,
            Long buyerId
    );

    // Orders belonging to all stores owned by this seller
    List<PrintOrder> findAllByStore_Seller_IdOrderByCreatedAtDesc(
            Long sellerId
    );

    // Ensure seller owns the store associated with the order
    Optional<PrintOrder> findByIdAndStore_Seller_Id(
            Long orderId,
            Long sellerId
    );
}

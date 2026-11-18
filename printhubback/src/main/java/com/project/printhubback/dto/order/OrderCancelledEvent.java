package com.project.printhubback.dto.order;

// Published when a buyer cancels an order.
// The seller who owns the store is notified.
public record OrderCancelledEvent(
        Long sellerId,
        PrintOrderResponse order
) {
}
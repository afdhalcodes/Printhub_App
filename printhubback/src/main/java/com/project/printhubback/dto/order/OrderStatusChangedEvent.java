package com.project.printhubback.dto.order;

// Published when a seller moves an order to a new status
// (PRINTING, PRINTED or COLLECTED). The buyer is notified.
public record OrderStatusChangedEvent(
        Long buyerId,
        PrintOrderResponse order
) {
}
package com.project.printhubback.dto.order;

public record OrderPlacedEvent(
        Long sellerId,
        PrintOrderResponse order
) {
}

package com.project.printhubback.service.notification;

import com.project.printhubback.dto.order.OrderCancelledEvent;
import com.project.printhubback.dto.order.OrderStatusChangedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// IMPORTANT: this class must be a Spring bean (@Component).
// The old OrderPrintedEventListener was missing @Component, so Spring
// never called it and the buyer never received the "printed" update.
@Component
public class OrderStatusEventListener {

    private final OrderNotificationService notificationService;

    public OrderStatusEventListener(
            OrderNotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    // Seller changed the order status -> tell the buyer.
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {

        notificationService.notifyBuyer(
                event.buyerId(),
                "order-status",
                event.order()
        );
    }

    // Buyer cancelled the order -> tell the seller.
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleOrderCancelled(OrderCancelledEvent event) {

        notificationService.notifySeller(
                event.sellerId(),
                "order-cancelled",
                event.order()
        );
    }
}
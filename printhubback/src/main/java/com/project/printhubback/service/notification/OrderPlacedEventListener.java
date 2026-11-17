package com.project.printhubback.service.notification;

import com.project.printhubback.dto.order.OrderPlacedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class OrderPlacedEventListener {

    private final OrderNotificationService notificationService;

    public OrderPlacedEventListener(
            OrderNotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {

        notificationService.notifySeller(
                event.sellerId(),
                "new-order",
                event.order()
        );
    }
}

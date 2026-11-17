package com.project.printhubback.controller;

import com.project.printhubback.service.auth.UserPrincipal;
import com.project.printhubback.service.notification.OrderNotificationService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
public class OrderNotificationController {

    private final OrderNotificationService notificationService;

    public OrderNotificationController(
            OrderNotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    @GetMapping(
            value = "/seller/notifications/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    @PreAuthorize("hasRole('SELLER')")
    public SseEmitter sellerNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return notificationService.subscribeSeller(
                principal.getId()
        );
    }

    @GetMapping(
            value = "/buyer/notifications/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    @PreAuthorize("hasRole('BUYER')")
    public SseEmitter buyerNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return notificationService.subscribeBuyer(
                principal.getId()
        );
    }
}

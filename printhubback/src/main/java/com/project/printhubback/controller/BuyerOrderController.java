package com.project.printhubback.controller;

import com.project.printhubback.dto.order.PrintOrderResponse;
import com.project.printhubback.model.order.PrintSide;
import com.project.printhubback.model.order.PrintType;
import com.project.printhubback.service.auth.UserPrincipal;
import com.project.printhubback.service.order.PrintOrderService;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/buyer/orders")
@PreAuthorize("hasRole('BUYER')")
public class BuyerOrderController {

    private final PrintOrderService printOrderService;

    public BuyerOrderController(
            PrintOrderService printOrderService
    ) {
        this.printOrderService = printOrderService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrintOrderResponse> createOrder(

            @RequestParam Long storeId,

            @RequestParam("document") MultipartFile document,

            @RequestParam PrintType printType,

            @RequestParam PrintSide printSide,

            @RequestParam Integer copies,

            @RequestParam Boolean bindingRequired,

            @AuthenticationPrincipal UserPrincipal principal

    ) {

        PrintOrderResponse response =
                printOrderService.createOrder(
                        storeId,
                        document,
                        printType,
                        printSide,
                        copies,
                        bindingRequired,
                        principal
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<PrintOrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.getBuyerOrders(principal)
        );
    }

    // Get an individual order
    @GetMapping("/{orderId}")
    public ResponseEntity<PrintOrderResponse> getOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.getBuyerOrder(
                        orderId,
                        principal
                )
        );
    }

    // Cancel an order before printing begins
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<PrintOrderResponse> cancelOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.cancelBuyerOrder(
                        orderId,
                        principal
                )
        );
    }
}

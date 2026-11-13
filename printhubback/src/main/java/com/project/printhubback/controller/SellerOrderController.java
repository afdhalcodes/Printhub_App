package com.project.printhubback.controller;

import com.project.printhubback.dto.order.OrderStatusRequest;
import com.project.printhubback.dto.order.PrintOrderResponse;
import com.project.printhubback.model.order.PrintOrder;

import com.project.printhubback.service.auth.UserPrincipal;
import com.project.printhubback.service.order.OrderDocumentStorageService;
import com.project.printhubback.service.order.PrintOrderService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import java.util.List;

@RestController
@RequestMapping("/api/seller/orders")
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {

    private final PrintOrderService printOrderService;
    private final OrderDocumentStorageService documentStorageService;

    public SellerOrderController(
            PrintOrderService printOrderService,
            OrderDocumentStorageService documentStorageService
    ) {
        this.printOrderService = printOrderService;
        this.documentStorageService = documentStorageService;
    }

    @GetMapping
    public ResponseEntity<List<PrintOrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.getSellerOrders(principal)
        );
    }

    // Get individual order details
    @GetMapping("/{orderId}")
    public ResponseEntity<PrintOrderResponse> getOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.getSellerOrder(
                        orderId,
                        principal
                )
        );
    }

    // Download buyer's PDF document
    @GetMapping("/{orderId}/document")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {

        // Verify that the seller owns the store.
        PrintOrder order = printOrderService.getSellerOwnedOrder(
                orderId,
                principal
        );

        Path documentPath = documentStorageService.getDocumentPath(
                order.getStoredDocumentName()
        );

        if (!Files.isRegularFile(documentPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(
                documentPath.toUri()
        );

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        ContentDisposition disposition =
                ContentDisposition.attachment()
                        .filename(
                                order.getDocumentName(),
                                StandardCharsets.UTF_8
                        )
                        .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        disposition.toString()
                )
                .body(resource);
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<PrintOrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody OrderStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                printOrderService.updateSellerOrderStatus(
                        orderId,
                        request.getStatus(),
                        principal
                )
        );
    }
}

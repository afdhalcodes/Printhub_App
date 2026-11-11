package com.project.printhubback.controller;

import com.project.printhubback.dto.store.StorePricingRequest;
import com.project.printhubback.dto.store.StorePricingResponse;
import com.project.printhubback.service.auth.UserPrincipal;
import com.project.printhubback.service.store.StorePricingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/stores/{storeId}/pricing")
@PreAuthorize("hasRole('SELLER')")
public class StorePricingController {

    private final StorePricingService storePricingService;

    public StorePricingController(
            StorePricingService storePricingService
    ) {
        this.storePricingService = storePricingService;
    }

    @PostMapping
    public ResponseEntity<StorePricingResponse> createPricing(
            @PathVariable Long storeId,
            @RequestBody StorePricingRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storePricingService.createPricing(
                        storeId,
                        request,
                        principal
                )
        );
    }

    // Get pricing
    @GetMapping
    public ResponseEntity<StorePricingResponse> getPricing(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storePricingService.getPricing(
                        storeId,
                        principal
                )
        );
    }

    // Update pricing
    @PutMapping
    public ResponseEntity<StorePricingResponse> updatePricing(
            @PathVariable Long storeId,
            @RequestBody StorePricingRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storePricingService.updatePricing(
                        storeId,
                        request,
                        principal
                )
        );
    }
}

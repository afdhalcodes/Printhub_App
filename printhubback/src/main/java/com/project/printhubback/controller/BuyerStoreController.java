package com.project.printhubback.controller;

import com.project.printhubback.dto.store.StorePricingResponse;
import com.project.printhubback.dto.store.StoreResponse;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.service.buyer.BuyerStoreService;
import com.project.printhubback.service.store.StoreImageService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/buyer/stores")
@PreAuthorize("hasRole('BUYER')")
public class BuyerStoreController {

    private final BuyerStoreService buyerStoreService;
    private final StoreImageService storeImageService;

    public BuyerStoreController(
            BuyerStoreService buyerStoreService,
            StoreImageService storeImageService
    ) {
        this.buyerStoreService = buyerStoreService;
        this.storeImageService = storeImageService;
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getActiveStores() {

        return ResponseEntity.ok(
                buyerStoreService.getActiveStores()
        );
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStoreDetails(
            @PathVariable Long storeId
    ) {

        return ResponseEntity.ok(
                buyerStoreService.getStoreDetails(storeId)
        );
    }

    @GetMapping("/{storeId}/pricing")
    public ResponseEntity<StorePricingResponse> getStorePricing(
            @PathVariable Long storeId
    ) {

        return ResponseEntity.ok(
                buyerStoreService.getStorePricing(storeId)
        );
    }

    @GetMapping("/{storeId}/picture")
    public ResponseEntity<Resource> getStorePicture(
            @PathVariable Long storeId
    ) throws IOException {

        Store store = buyerStoreService.getActiveStore(storeId);

        if (store.getPictureName() == null) {
            return ResponseEntity.notFound().build();
        }

        Path imagePath = storeImageService.getImagePath(
                store.getPictureName()
        );

        if (!Files.exists(imagePath) ||
                !Files.isRegularFile(imagePath)) {

            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(imagePath.toUri());

        String contentType = Files.probeContentType(imagePath);

        MediaType mediaType =
                "image/png".equalsIgnoreCase(contentType)
                        ? MediaType.IMAGE_PNG
                        : MediaType.IMAGE_JPEG;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" +
                                store.getPictureName() + "\""
                )
                .body(resource);
    }
}

package com.project.printhubback.controller;

import com.project.printhubback.dto.store.StoreRequest;
import com.project.printhubback.dto.store.StoreResponse;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.repository.StoreRepo;
import com.project.printhubback.service.auth.UserPrincipal;
import com.project.printhubback.service.store.StoreImageService;
import com.project.printhubback.service.store.StoreService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/stores")
@PreAuthorize("hasRole('SELLER')")
public class StoreController {

    private final StoreService storeService;
    private final StoreRepo storeRepo;
    private final StoreImageService storeImageService;

    public StoreController(
            StoreService storeService,
            StoreRepo storeRepo,
            StoreImageService storeImageService
    ) {
        this.storeService = storeService;
        this.storeRepo = storeRepo;
        this.storeImageService = storeImageService;
    }

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(
            @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        StoreResponse response =
                storeService.createStore(request, principal);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getMyStores(
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storeService.getMyStores(principal)
        );
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStore(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storeService.getStore(storeId, principal)
        );
    }

    @PutMapping("/{storeId}")
    public ResponseEntity<StoreResponse> updateStore(
            @PathVariable Long storeId,
            @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                storeService.updateStore(storeId, request, principal)
        );
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<Void> deleteStore(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        Store store = getOwnedStore(storeId, principal);

        String pictureName = store.getPictureName();

        storeService.deleteStore(storeId, principal);

        storeImageService.deleteImage(pictureName);

        return ResponseEntity.noContent().build();
    }

    // Upload or replace a store picture
    @PostMapping(
            value = "/{storeId}/picture",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadStorePicture(
            @PathVariable Long storeId,
            @RequestParam("picture") MultipartFile picture,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        Store store = getOwnedStore(storeId, principal);

        String oldPictureName = store.getPictureName();

        String newPictureName =
                storeImageService.saveImage(picture);

        try {
            store.setPictureName(newPictureName);
            storeRepo.save(store);
        } catch (RuntimeException e) {
            storeImageService.deleteImage(newPictureName);
            throw e;
        }

        // Delete the previous image only after the new image is saved.
        if (oldPictureName != null) {
            storeImageService.deleteImage(oldPictureName);
        }

        return ResponseEntity.ok(
                Map.of(
                        "message", "Store picture uploaded successfully",
                        "pictureName", newPictureName,
                        "pictureUrl",
                        "/api/seller/stores/" + storeId + "/picture"
                )
        );
    }

    @GetMapping("/{storeId}/picture")
    public ResponseEntity<Resource> getStorePicture(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {

        Store store = getOwnedStore(storeId, principal);

        if (store.getPictureName() == null) {
            System.out.println("Image not found");
            return ResponseEntity.notFound().build();
        }

        Path imagePath =
                storeImageService.getImagePath(store.getPictureName());

        if (!Files.exists(imagePath)) {
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

    private Store getOwnedStore(
            Long storeId,
            UserPrincipal principal
    ) {

        return storeRepo.findByIdAndSeller_Id(
                        storeId,
                        principal.getId()
                )
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Store not found or you do not own this store"
                        )
                );
    }
}

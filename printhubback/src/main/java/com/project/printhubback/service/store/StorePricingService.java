package com.project.printhubback.service.store;


import com.project.printhubback.dto.store.StorePricingRequest;
import com.project.printhubback.dto.store.StorePricingResponse;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.model.seller.StorePricing;
import com.project.printhubback.repository.StorePricingRepo;
import com.project.printhubback.repository.StoreRepo;
import com.project.printhubback.service.auth.UserPrincipal;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
@Service
@Transactional
public class StorePricingService {

    private final StoreRepo storeRepo;
    private final StorePricingRepo storePricingRepo;

    public StorePricingService(
            StoreRepo storeRepo,
            StorePricingRepo storePricingRepo
    ) {
        this.storeRepo = storeRepo;
        this.storePricingRepo = storePricingRepo;
    }


    public StorePricingResponse createPricing(
            Long storeId,
            StorePricingRequest request,
            UserPrincipal principal
    ) {

        Store store = getOwnedStore(storeId, principal);

        if (storePricingRepo.existsByStore_Id(storeId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pricing already exists for this store"
            );
        }

        validatePricing(request);

        StorePricing pricing = new StorePricing();

        pricing.setStore(store);

        setPricingValues(pricing, request);

        StorePricing savedPricing =
                storePricingRepo.save(pricing);

        return convertToResponse(savedPricing);
    }

    // Get pricing for a store
    @Transactional(readOnly = true)
    public StorePricingResponse getPricing(
            Long storeId,
            UserPrincipal principal
    ) {

        getOwnedStore(storeId, principal);

        StorePricing pricing = storePricingRepo
                .findByStore_Id(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Pricing not found for this store"
                        )
                );

        return convertToResponse(pricing);
    }

    // Update existing pricing
    public StorePricingResponse updatePricing(
            Long storeId,
            StorePricingRequest request,
            UserPrincipal principal
    ) {

        getOwnedStore(storeId, principal);

        StorePricing pricing = storePricingRepo
                .findByStore_Id(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Pricing not found for this store"
                        )
                );

        validatePricing(request);

        setPricingValues(pricing, request);

        StorePricing updatedPricing =
                storePricingRepo.save(pricing);

        return convertToResponse(updatedPricing);
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

    private void validatePricing(StorePricingRequest request) {

        validateCost(request.getBindingCost(), "Binding cost");

        validateCost(
                request.getBlackAndWhiteSingleSideCost(),
                "B/W single-side cost"
        );

        validateCost(
                request.getBlackAndWhiteDoubleSideCost(),
                "B/W double-side cost"
        );

        validateCost(
                request.getColourSingleSideCost(),
                "Colour single-side cost"
        );

        validateCost(
                request.getColourDoubleSideCost(),
                "Colour double-side cost"
        );
    }

    private void validateCost(BigDecimal cost, String fieldName) {

        if (cost == null || cost.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    fieldName + " must be zero or greater"
            );
        }
    }

    private void setPricingValues(
            StorePricing pricing,
            StorePricingRequest request
    ) {

        pricing.setBindingCost(request.getBindingCost());

        pricing.setBlackAndWhiteSingleSideCost(
                request.getBlackAndWhiteSingleSideCost()
        );

        pricing.setBlackAndWhiteDoubleSideCost(
                request.getBlackAndWhiteDoubleSideCost()
        );

        pricing.setColourSingleSideCost(
                request.getColourSingleSideCost()
        );

        pricing.setColourDoubleSideCost(
                request.getColourDoubleSideCost()
        );
    }

    // Convert entity into response DTO
    private StorePricingResponse convertToResponse(
            StorePricing pricing
    ) {

        return new StorePricingResponse(
                pricing.getId(),
                pricing.getStore().getId(),
                pricing.getBindingCost(),
                pricing.getBlackAndWhiteSingleSideCost(),
                pricing.getBlackAndWhiteDoubleSideCost(),
                pricing.getColourSingleSideCost(),
                pricing.getColourDoubleSideCost()
        );
    }
}

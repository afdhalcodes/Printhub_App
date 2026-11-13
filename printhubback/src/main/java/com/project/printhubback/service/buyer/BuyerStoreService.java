package com.project.printhubback.service.buyer;

import com.project.printhubback.dto.store.StorePricingResponse;
import com.project.printhubback.dto.store.StoreResponse;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.model.seller.StorePricing;
import com.project.printhubback.repository.StorePricingRepo;
import com.project.printhubback.repository.StoreRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class BuyerStoreService {

    private final StoreRepo storeRepo;
    private final StorePricingRepo storePricingRepo;

    public BuyerStoreService(
            StoreRepo storeRepo,
            StorePricingRepo storePricingRepo
    ) {
        this.storeRepo = storeRepo;
        this.storePricingRepo = storePricingRepo;
    }


    public List<StoreResponse> getActiveStores() {

        return storeRepo.findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::convertToStoreResponse)
                .toList();
    }

    // Get individual store details
    public StoreResponse getStoreDetails(Long storeId) {

        Store store = getActiveStore(storeId);

        return convertToStoreResponse(store);
    }

    // Get pricing of a particular store
    public StorePricingResponse getStorePricing(Long storeId) {

        getActiveStore(storeId);

        StorePricing pricing = storePricingRepo
                .findByStore_Id(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Pricing has not been configured for this store"
                        )
                );

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

    // Find an active store
    public Store getActiveStore(Long storeId) {

        return storeRepo.findByIdAndActiveTrue(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Store not found or currently unavailable"
                        )
                );
    }

    // Convert entity into response DTO
    private StoreResponse convertToStoreResponse(Store store) {

        return new StoreResponse(
                store.getId(),
                store.getName(),
                store.getLocation(),
                store.getEmail(),
                store.getPhoneNumber(),
                store.getDescription(),
                store.getOpeningTime(),
                store.getClosingTime(),
                store.isActive(),
                store.getPictureName()
        );
    }
}

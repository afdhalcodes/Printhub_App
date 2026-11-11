package com.project.printhubback.service.store;

import com.project.printhubback.dto.store.StoreRequest;
import com.project.printhubback.dto.store.StoreResponse;
import com.project.printhubback.model.authentication.User;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.repository.StoreRepo;
import com.project.printhubback.repository.UserRepo;
import com.project.printhubback.service.auth.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StoreService {

    private final StoreRepo storeRepo;
    private final UserRepo userRepo;

    public StoreService(StoreRepo storeRepo, UserRepo userRepo) {
        this.storeRepo = storeRepo;
        this.userRepo = userRepo;
    }

    public StoreResponse createStore(StoreRequest request, UserPrincipal principal)
    {
        User seller = getSeller(principal);

        Store store = new Store();

        store.setSeller(seller);
        store.setName(request.getName());
        store.setLocation(request.getLocation());
        store.setEmail(request.getEmail());
        store.setPhoneNumber(request.getPhoneNumber());
        store.setDescription(request.getDescription());
        store.setOpeningTime(request.getOpeningTime());
        store.setClosingTime(request.getClosingTime());

        store.setActive(true);
        store.setPictureName(null);

        Store savedStore = storeRepo.save(store);

        return convertToResponse(savedStore);
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> getMyStores(UserPrincipal principal) {

        Long sellerId = principal.getId();

        return storeRepo.findAllBySeller_Id(sellerId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoreResponse getStore(Long storeId,
                                  UserPrincipal principal) {

        Store store = getSellerStore(storeId, principal);

        return convertToResponse(store);
    }

    public StoreResponse updateStore(Long storeId,
                                     StoreRequest request,
                                     UserPrincipal principal) {

        Store store = getSellerStore(storeId, principal);

        store.setName(request.getName());
        store.setLocation(request.getLocation());
        store.setEmail(request.getEmail());
        store.setPhoneNumber(request.getPhoneNumber());
        store.setDescription(request.getDescription());
        store.setOpeningTime(request.getOpeningTime());
        store.setClosingTime(request.getClosingTime());

        Store updatedStore = storeRepo.save(store);

        return convertToResponse(updatedStore);
    }

    public void deleteStore(Long storeId, UserPrincipal principal) {

        Store store = getSellerStore(storeId, principal);

        storeRepo.delete(store);
    }

    // Find the authenticated seller
    private User getSeller(UserPrincipal principal) {

        return userRepo.findById(principal.getId())
                .orElseThrow(() ->
                        new RuntimeException("Seller not found"));
    }

    private Store getSellerStore(Long storeId,
                                 UserPrincipal principal) {

        return storeRepo.findByIdAndSeller_Id(
                        storeId,
                        principal.getId()
                )
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Store not found or you do not own this store"
                        ));
    }

    private StoreResponse convertToResponse(Store store) {

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

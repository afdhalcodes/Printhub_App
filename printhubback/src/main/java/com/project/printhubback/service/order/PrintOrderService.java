package com.project.printhubback.service.order;

import com.project.printhubback.dto.order.OrderPlacedEvent;
import com.project.printhubback.dto.order.PrintOrderResponse;

import com.project.printhubback.model.authentication.User;
import com.project.printhubback.model.order.OrderStatus;
import com.project.printhubback.model.order.PrintOrder;
import com.project.printhubback.model.order.PrintSide;
import com.project.printhubback.model.order.PrintType;
import com.project.printhubback.model.seller.Store;
import com.project.printhubback.model.seller.StorePricing;

import com.project.printhubback.repository.PrintOrderRepo;
import com.project.printhubback.repository.StorePricingRepo;
import com.project.printhubback.repository.StoreRepo;
import com.project.printhubback.repository.UserRepo;

import com.project.printhubback.service.auth.UserPrincipal;

import org.springframework.context.ApplicationEventPublisher;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import com.project.printhubback.dto.order.OrderCancelledEvent;
import com.project.printhubback.dto.order.OrderStatusChangedEvent;

@Service
@Transactional
public class PrintOrderService {

    private final PrintOrderRepo printOrderRepo;
    private final StoreRepo storeRepo;
    private final StorePricingRepo storePricingRepo;
    private final UserRepo userRepo;
    private final OrderDocumentStorageService documentStorageService;
    private final ApplicationEventPublisher eventPublisher;

    public PrintOrderService(
            PrintOrderRepo printOrderRepo,
            StoreRepo storeRepo,
            StorePricingRepo storePricingRepo,
            UserRepo userRepo,
            OrderDocumentStorageService documentStorageService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.printOrderRepo = printOrderRepo;
        this.storeRepo = storeRepo;
        this.storePricingRepo = storePricingRepo;
        this.userRepo = userRepo;
        this.documentStorageService = documentStorageService;
        this.eventPublisher = eventPublisher;
    }

    public PrintOrderResponse createOrder(
            Long storeId,
            MultipartFile document,
            PrintType printType,
            PrintSide printSide,
            Integer copies,
            Boolean bindingRequired,
            UserPrincipal principal
    ) {

        validateOrderRequest(
                printType, printSide,
                copies, bindingRequired
        );

        Store store = storeRepo.findByIdAndActiveTrue(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Store not found or unavailable"
                        )
                );

        StorePricing pricing = storePricingRepo
                .findByStore_Id(storeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "This store has not configured its pricing"
                        )
                );

        User buyer = userRepo.findById(principal.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Buyer account not found"
                        )
                );

        // Save and process PDF
        OrderDocumentStorageService.StoredPdf storedPdf =
                documentStorageService.savePdf(document);

        boolean saved = false;

        try {

            int totalPages = storedPdf.pageCount();

            // Calculate physical sheets for one copy
            int sheetsPerCopy = printSide == PrintSide.SINGLE_SIDE
                    ? totalPages
                    : (totalPages + 1) / 2;

            // Get the actual rate configured by the seller
            BigDecimal pricePerSheet = getPricePerSheet(
                    pricing,
                    printType,
                    printSide
            );

            // Printing price for all copies
            BigDecimal printingCost = pricePerSheet
                    .multiply(BigDecimal.valueOf(sheetsPerCopy))
                    .multiply(BigDecimal.valueOf(copies));

            // Binding cost is charged once per copy
            BigDecimal bindingCost = bindingRequired
                    ? pricing.getBindingCost()
                    : BigDecimal.ZERO;

            BigDecimal totalBindingCost = bindingCost
                    .multiply(BigDecimal.valueOf(copies));

            BigDecimal totalPrice = printingCost
                    .add(totalBindingCost)
                    .setScale(2, RoundingMode.HALF_UP);

            PrintOrder order = new PrintOrder();

            order.setBuyer(buyer);
            order.setStore(store);

            order.setDocumentName(
                    storedPdf.originalFileName()
            );

            order.setStoredDocumentName(
                    storedPdf.storedFileName()
            );

            order.setTotalPages(totalPages);
            order.setCopies(copies);

            order.setPrintType(printType);
            order.setPrintSide(printSide);

            order.setBindingRequired(bindingRequired);

            order.setSheetsPerCopy(sheetsPerCopy);

            order.setPricePerSheet(pricePerSheet);
            order.setBindingCost(bindingCost);

            order.setTotalPrice(totalPrice);

            order.setStatus(OrderStatus.PLACED);

            PrintOrder savedOrder = printOrderRepo.save(order);

            saved = true;

            // Convert the saved order into the response DTO.
            PrintOrderResponse response = convertToResponse(savedOrder);

            // Get the seller who owns the selected store.
            Long sellerId = store.getSeller().getId();

            // Publish an event.
            // The listener will send the SSE notification after commit.
            eventPublisher.publishEvent(
                    new OrderPlacedEvent(
                            sellerId,
                            response
                    )
            );

            return response;

        } finally {

            // If database saving fails, remove the uploaded PDF.
            if (!saved) {
                documentStorageService.deleteDocument(
                        storedPdf.storedFileName()
                );
            }
        }
    }

    private BigDecimal getPricePerSheet(
            StorePricing pricing,
            PrintType printType,
            PrintSide printSide
    ) {

        BigDecimal price;

        if (printType == PrintType.BLACK_AND_WHITE) {

            price = printSide == PrintSide.SINGLE_SIDE
                    ? pricing.getBlackAndWhiteSingleSideCost()
                    : pricing.getBlackAndWhiteDoubleSideCost();

        } else {

            price = printSide == PrintSide.SINGLE_SIDE
                    ? pricing.getColourSingleSideCost()
                    : pricing.getColourDoubleSideCost();
        }

        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected printing price is not configured correctly"
            );
        }

        return price;
    }


    private void validateOrderRequest(
            PrintType printType,
            PrintSide printSide,
            Integer copies,
            Boolean bindingRequired
    ) {

        if (printType == null) {
            throw new IllegalArgumentException(
                    "Please select a print type"
            );
        }

        if (printSide == null) {
            throw new IllegalArgumentException(
                    "Please select a printing side"
            );
        }

        if (copies == null || copies < 1 || copies > 20) {
            throw new IllegalArgumentException(
                    "Copies must be between 1 and 20"
            );
        }

        if (bindingRequired == null) {
            throw new IllegalArgumentException(
                    "Please specify whether binding is required"
            );
        }
    }



    @Transactional(readOnly = true)
    public List<PrintOrderResponse> getBuyerOrders(
            UserPrincipal principal
    ) {

        return printOrderRepo
                .findAllByBuyer_IdOrderByCreatedAtDesc(
                        principal.getId()
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrintOrderResponse getBuyerOrder(
            Long orderId,
            UserPrincipal principal
    ) {

        PrintOrder order = printOrderRepo
                .findByIdAndBuyer_Id(
                        orderId,
                        principal.getId()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Order not found"
                        )
                );

        return convertToResponse(order);
    }

    public PrintOrderResponse cancelBuyerOrder(
            Long orderId,
            UserPrincipal principal
    ) {

        PrintOrder order = printOrderRepo
                .findByIdAndBuyer_Id(
                        orderId,
                        principal.getId()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Order not found"
                        )
                );

        if (order.getStatus() != OrderStatus.PLACED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only orders that have not started printing can be cancelled"
            );
        }

        order.setStatus(OrderStatus.CANCELLED);

        PrintOrder savedOrder = printOrderRepo.save(order);

        PrintOrderResponse response = convertToResponse(savedOrder);

        // Tell the seller who owns the store (sent after commit).
        eventPublisher.publishEvent(
                new OrderCancelledEvent(
                        savedOrder.getStore().getSeller().getId(),
                        response
                )
        );

        return response;
    }

    @Transactional(readOnly = true)
    public List<PrintOrderResponse> getSellerOrders(
            UserPrincipal principal
    ) {

        return printOrderRepo
                .findAllByStore_Seller_IdOrderByCreatedAtDesc(
                        principal.getId()
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrintOrderResponse getSellerOrder(
            Long orderId,
            UserPrincipal principal
    ) {

        PrintOrder order = getSellerOwnedOrder(
                orderId,
                principal
        );

        return convertToResponse(order);
    }

    public PrintOrderResponse updateSellerOrderStatus(
            Long orderId,
            OrderStatus newStatus,
            UserPrincipal principal
    ) {

        if (newStatus == null) {
            throw new IllegalArgumentException(
                    "Order status is required"
            );
        }

        PrintOrder order = getSellerOwnedOrder(
                orderId,
                principal
        );

        OrderStatus currentStatus = order.getStatus();

        boolean validTransition =
                (currentStatus == OrderStatus.PLACED &&
                        newStatus == OrderStatus.PRINTING)
                        ||
                        (currentStatus == OrderStatus.PRINTING &&
                                newStatus == OrderStatus.PRINTED)
                        ||
                        (currentStatus == OrderStatus.PRINTED &&
                                newStatus == OrderStatus.COLLECTED);

        if (!validTransition) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invalid order status transition"
            );
        }

        order.setStatus(newStatus);

        PrintOrder savedOrder = printOrderRepo.save(order);

        PrintOrderResponse response = convertToResponse(savedOrder);

        // Tell the buyer about every step: PRINTING, PRINTED, COLLECTED.
        // The listener sends it after the transaction commits.
        Long buyerId = savedOrder.getBuyer().getId();

        eventPublisher.publishEvent(
                new OrderStatusChangedEvent(
                        buyerId,
                        response
                )
        );

        return response;
    }


    @Transactional(readOnly = true)
    public PrintOrder getSellerOwnedOrder(
            Long orderId,
            UserPrincipal principal
    ) {

        return printOrderRepo
                .findByIdAndStore_Seller_Id(
                        orderId,
                        principal.getId()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Order not found"
                        )
                );
    }


    private PrintOrderResponse convertToResponse(
            PrintOrder order
    ) {

        return new PrintOrderResponse(
                order.getId(),
                order.getStore().getId(),
                order.getStore().getName(),
                order.getBuyer().getUsername(),
                order.getDocumentName(),
                order.getTotalPages(),
                order.getCopies(),
                order.getSheetsPerCopy(),
                order.getPrintType(),
                order.getPrintSide(),
                order.isBindingRequired(),
                order.getPricePerSheet(),
                order.getBindingCost(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
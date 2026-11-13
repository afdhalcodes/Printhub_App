package com.project.printhubback.dto.order;

import com.project.printhubback.model.order.OrderStatus;
import com.project.printhubback.model.order.PrintSide;
import com.project.printhubback.model.order.PrintType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PrintOrderResponse {

    private Long id;

    private Long storeId;

    private String storeName;

    private String buyerUsername;

    private String documentName;

    private Integer totalPages;

    private Integer copies;

    private Integer sheetsPerCopy;

    private PrintType printType;

    private PrintSide printSide;

    private boolean bindingRequired;

    private BigDecimal pricePerSheet;

    private BigDecimal bindingCost;

    private BigDecimal totalPrice;

    private OrderStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public PrintOrderResponse(Long id, Long storeId, String storeName, String buyerUsername, String documentName, Integer totalPages, Integer copies, Integer sheetsPerCopy, PrintType printType, PrintSide printSide, boolean bindingRequired, BigDecimal pricePerSheet, BigDecimal bindingCost, BigDecimal totalPrice, OrderStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.storeId = storeId;
        this.storeName = storeName;
        this.buyerUsername = buyerUsername;
        this.documentName = documentName;
        this.totalPages = totalPages;
        this.copies = copies;
        this.sheetsPerCopy = sheetsPerCopy;
        this.printType = printType;
        this.printSide = printSide;
        this.bindingRequired = bindingRequired;
        this.pricePerSheet = pricePerSheet;
        this.bindingCost = bindingCost;
        this.totalPrice = totalPrice;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getBuyerUsername() {
        return buyerUsername;
    }

    public void setBuyerUsername(String buyerUsername) {
        this.buyerUsername = buyerUsername;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public Integer getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(Integer totalPages) {
        this.totalPages = totalPages;
    }

    public Integer getCopies() {
        return copies;
    }

    public void setCopies(Integer copies) {
        this.copies = copies;
    }

    public Integer getSheetsPerCopy() {
        return sheetsPerCopy;
    }

    public void setSheetsPerCopy(Integer sheetsPerCopy) {
        this.sheetsPerCopy = sheetsPerCopy;
    }

    public PrintType getPrintType() {
        return printType;
    }

    public void setPrintType(PrintType printType) {
        this.printType = printType;
    }

    public PrintSide getPrintSide() {
        return printSide;
    }

    public void setPrintSide(PrintSide printSide) {
        this.printSide = printSide;
    }

    public boolean isBindingRequired() {
        return bindingRequired;
    }

    public void setBindingRequired(boolean bindingRequired) {
        this.bindingRequired = bindingRequired;
    }

    public BigDecimal getPricePerSheet() {
        return pricePerSheet;
    }

    public void setPricePerSheet(BigDecimal pricePerSheet) {
        this.pricePerSheet = pricePerSheet;
    }

    public BigDecimal getBindingCost() {
        return bindingCost;
    }

    public void setBindingCost(BigDecimal bindingCost) {
        this.bindingCost = bindingCost;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

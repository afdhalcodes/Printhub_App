package com.project.printhubback.model.order;

import com.project.printhubback.model.authentication.User;
import com.project.printhubback.model.seller.Store;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "print_orders")
public class PrintOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Buyer who placed the order
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    // Store selected by the buyer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    // Original uploaded filename
    @Column(nullable = false)
    private String documentName;

    // Generated filename stored on the server
    @Column(nullable = false, unique = true)
    private String storedDocumentName;

    // Extracted by PDFBox
    @Column(nullable = false)
    private Integer totalPages;

    @Column(nullable = false)
    private Integer copies;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrintType printType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrintSide printSide;

    @Column(nullable = false)
    private boolean bindingRequired;

    // Price per sheet for the selected printing option
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerSheet;

    // Binding price per copy, captured when the order is created
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal bindingCost;

    // Calculated physical sheets per copy
    @Column(nullable = false)
    private Integer sheetsPerCopy;

    // Final calculated estimated price
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public PrintOrder() {
    }

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getStoredDocumentName() {
        return storedDocumentName;
    }

    public void setStoredDocumentName(String storedDocumentName) {
        this.storedDocumentName = storedDocumentName;
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

    public Integer getSheetsPerCopy() {
        return sheetsPerCopy;
    }

    public void setSheetsPerCopy(Integer sheetsPerCopy) {
        this.sheetsPerCopy = sheetsPerCopy;
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

package com.project.printhubback.dto.store;

import java.math.BigDecimal;

public class StorePricingResponse {

    private Long id;

    private Long storeId;

    private BigDecimal bindingCost;

    private BigDecimal blackAndWhiteSingleSideCost;

    private BigDecimal blackAndWhiteDoubleSideCost;

    private BigDecimal colourSingleSideCost;

    private BigDecimal colourDoubleSideCost;

    public StorePricingResponse(Long id, Long storeId, BigDecimal bindingCost, BigDecimal blackAndWhiteSingleSideCost, BigDecimal blackAndWhiteDoubleSideCost, BigDecimal colourSingleSideCost, BigDecimal colourDoubleSideCost) {
        this.id = id;
        this.storeId = storeId;
        this.bindingCost = bindingCost;
        this.blackAndWhiteSingleSideCost = blackAndWhiteSingleSideCost;
        this.blackAndWhiteDoubleSideCost = blackAndWhiteDoubleSideCost;
        this.colourSingleSideCost = colourSingleSideCost;
        this.colourDoubleSideCost = colourDoubleSideCost;
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

    public BigDecimal getBindingCost() {
        return bindingCost;
    }

    public void setBindingCost(BigDecimal bindingCost) {
        this.bindingCost = bindingCost;
    }

    public BigDecimal getBlackAndWhiteSingleSideCost() {
        return blackAndWhiteSingleSideCost;
    }

    public void setBlackAndWhiteSingleSideCost(BigDecimal blackAndWhiteSingleSideCost) {
        this.blackAndWhiteSingleSideCost = blackAndWhiteSingleSideCost;
    }

    public BigDecimal getBlackAndWhiteDoubleSideCost() {
        return blackAndWhiteDoubleSideCost;
    }

    public void setBlackAndWhiteDoubleSideCost(BigDecimal blackAndWhiteDoubleSideCost) {
        this.blackAndWhiteDoubleSideCost = blackAndWhiteDoubleSideCost;
    }

    public BigDecimal getColourSingleSideCost() {
        return colourSingleSideCost;
    }

    public void setColourSingleSideCost(BigDecimal colourSingleSideCost) {
        this.colourSingleSideCost = colourSingleSideCost;
    }

    public BigDecimal getColourDoubleSideCost() {
        return colourDoubleSideCost;
    }

    public void setColourDoubleSideCost(BigDecimal colourDoubleSideCost) {
        this.colourDoubleSideCost = colourDoubleSideCost;
    }
}

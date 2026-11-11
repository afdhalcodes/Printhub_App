package com.project.printhubback.dto.store;

import java.math.BigDecimal;

public class StorePricingRequest {

    private BigDecimal bindingCost;

    private BigDecimal blackAndWhiteSingleSideCost;

    private BigDecimal blackAndWhiteDoubleSideCost;

    private BigDecimal colourSingleSideCost;

    private BigDecimal colourDoubleSideCost;

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

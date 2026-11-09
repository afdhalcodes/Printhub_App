package com.project.printhubback.model.seller;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "store_services",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "store_id")
        }
)
public class StorePricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(precision = 10, scale = 2)
    private BigDecimal bindingCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal blackAndWhiteSingleSideCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal blackAndWhiteDoubleSideCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal colourSingleSideCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal colourDoubleSideCost;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
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

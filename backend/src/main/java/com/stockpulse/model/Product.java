package com.stockpulse.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 50)
    private String id;

    @NotBlank(message = "SKU is required")
    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private Category category;

    @NotNull(message = "Current price is required")
    @Min(value = 0, message = "Current price must be non-negative")
    @Column(name = "current_price", nullable = false)
    private Double currentPrice;

    @NotNull(message = "Stock level is required")
    @Min(value = 0, message = "Stock level must be non-negative")
    @Column(name = "stock_level", nullable = false)
    private Integer stockLevel;

    @NotNull(message = "Reorder threshold is required")
    @Min(value = 0, message = "Reorder threshold must be non-negative")
    @Column(name = "reorder_threshold", nullable = false)
    private Integer reorderThreshold;

    @NotNull(message = "Demand velocity is required")
    @Min(value = 0, message = "Demand velocity must be non-negative")
    @Column(name = "demand_velocity", nullable = false)
    private Integer demandVelocity;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ProductStatus status;

    // Sprint 2 / Sprint 3 Extension placeholders
    @Column(name = "cost_price")
    private Double costPrice;

    @Column(name = "margin_floor")
    private Double marginFloor;

    @Column(name = "supplier_id")
    private String supplierId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Product() {}

    public Product(String id, String sku, String name, Category category, Double currentPrice,
                   Integer stockLevel, Integer reorderThreshold, Integer demandVelocity,
                   ProductStatus status, Double costPrice, Double marginFloor, String supplierId,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.currentPrice = currentPrice;
        this.stockLevel = stockLevel;
        this.reorderThreshold = reorderThreshold;
        this.demandVelocity = demandVelocity;
        this.status = status;
        this.costPrice = costPrice;
        this.marginFloor = marginFloor;
        this.supplierId = supplierId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ProductBuilder builder() {
        return new ProductBuilder();
    }

    public static class ProductBuilder {
        private String id;
        private String sku;
        private String name;
        private Category category;
        private Double currentPrice;
        private Integer stockLevel;
        private Integer reorderThreshold;
        private Integer demandVelocity;
        private ProductStatus status;
        private Double costPrice;
        private Double marginFloor;
        private String supplierId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ProductBuilder id(String id) { this.id = id; return this; }
        public ProductBuilder sku(String sku) { this.sku = sku; return this; }
        public ProductBuilder name(String name) { this.name = name; return this; }
        public ProductBuilder category(Category category) { this.category = category; return this; }
        public ProductBuilder currentPrice(Double currentPrice) { this.currentPrice = currentPrice; return this; }
        public ProductBuilder stockLevel(Integer stockLevel) { this.stockLevel = stockLevel; return this; }
        public ProductBuilder reorderThreshold(Integer reorderThreshold) { this.reorderThreshold = reorderThreshold; return this; }
        public ProductBuilder demandVelocity(Integer demandVelocity) { this.demandVelocity = demandVelocity; return this; }
        public ProductBuilder status(ProductStatus status) { this.status = status; return this; }
        public ProductBuilder costPrice(Double costPrice) { this.costPrice = costPrice; return this; }
        public ProductBuilder marginFloor(Double marginFloor) { this.marginFloor = marginFloor; return this; }
        public ProductBuilder supplierId(String supplierId) { this.supplierId = supplierId; return this; }
        public ProductBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ProductBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Product build() {
            return new Product(id, sku, name, category, currentPrice, stockLevel, reorderThreshold,
                    demandVelocity, status, costPrice, marginFloor, supplierId, createdAt, updatedAt);
        }
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = (this.stockLevel != null && this.stockLevel == 0) 
                    ? ProductStatus.OUT_OF_STOCK 
                    : ProductStatus.ACTIVE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }

    public Integer getStockLevel() { return stockLevel; }
    public void setStockLevel(Integer stockLevel) { this.stockLevel = stockLevel; }

    public Integer getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(Integer reorderThreshold) { this.reorderThreshold = reorderThreshold; }

    public Integer getDemandVelocity() { return demandVelocity; }
    public void setDemandVelocity(Integer demandVelocity) { this.demandVelocity = demandVelocity; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public Double getCostPrice() { return costPrice; }
    public void setCostPrice(Double costPrice) { this.costPrice = costPrice; }

    public Double getMarginFloor() { return marginFloor; }
    public void setMarginFloor(Double marginFloor) { this.marginFloor = marginFloor; }

    public String getSupplierId() { return supplierId; }
    public void setSupplierId(String supplierId) { this.supplierId = supplierId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}


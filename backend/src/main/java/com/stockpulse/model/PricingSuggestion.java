package com.stockpulse.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pricing_suggestions")
public class PricingSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(name = "current_price", nullable = false)
    private Double currentPrice;

    @Column(name = "recommended_price", nullable = false)
    private Double recommendedPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_direction", nullable = false, length = 20)
    private ChangeDirection changeDirection;

    @Column(name = "confidence", nullable = false)
    private Double confidence;

    @Column(name = "reasoning", nullable = false, columnDefinition = "TEXT")
    private String reasoning;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SuggestionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_reason", nullable = false, length = 30)
    private TriggerReason triggerReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    public PricingSuggestion() {}

    public PricingSuggestion(Long id, Product product, Double currentPrice, Double recommendedPrice,
                             ChangeDirection changeDirection, Double confidence, String reasoning,
                             SuggestionStatus status, TriggerReason triggerReason,
                             LocalDateTime createdAt, LocalDateTime decidedAt) {
        this.id = id;
        this.product = product;
        this.currentPrice = currentPrice;
        this.recommendedPrice = recommendedPrice;
        this.changeDirection = changeDirection;
        this.confidence = confidence;
        this.reasoning = reasoning;
        this.status = status;
        this.triggerReason = triggerReason;
        this.createdAt = createdAt;
        this.decidedAt = decidedAt;
    }

    public static PricingSuggestionBuilder builder() {
        return new PricingSuggestionBuilder();
    }

    public static class PricingSuggestionBuilder {
        private Long id;
        private Product product;
        private Double currentPrice;
        private Double recommendedPrice;
        private ChangeDirection changeDirection;
        private Double confidence;
        private String reasoning;
        private SuggestionStatus status;
        private TriggerReason triggerReason;
        private LocalDateTime createdAt;
        private LocalDateTime decidedAt;

        public PricingSuggestionBuilder id(Long id) { this.id = id; return this; }
        public PricingSuggestionBuilder product(Product product) { this.product = product; return this; }
        public PricingSuggestionBuilder currentPrice(Double currentPrice) { this.currentPrice = currentPrice; return this; }
        public PricingSuggestionBuilder recommendedPrice(Double recommendedPrice) { this.recommendedPrice = recommendedPrice; return this; }
        public PricingSuggestionBuilder changeDirection(ChangeDirection changeDirection) { this.changeDirection = changeDirection; return this; }
        public PricingSuggestionBuilder confidence(Double confidence) { this.confidence = confidence; return this; }
        public PricingSuggestionBuilder reasoning(String reasoning) { this.reasoning = reasoning; return this; }
        public PricingSuggestionBuilder status(SuggestionStatus status) { this.status = status; return this; }
        public PricingSuggestionBuilder triggerReason(TriggerReason triggerReason) { this.triggerReason = triggerReason; return this; }
        public PricingSuggestionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public PricingSuggestionBuilder decidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; return this; }

        public PricingSuggestion build() {
            return new PricingSuggestion(id, product, currentPrice, recommendedPrice, changeDirection,
                    confidence, reasoning, status, triggerReason, createdAt, decidedAt);
        }
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = SuggestionStatus.PENDING;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }

    public Double getRecommendedPrice() { return recommendedPrice; }
    public void setRecommendedPrice(Double recommendedPrice) { this.recommendedPrice = recommendedPrice; }

    public ChangeDirection getChangeDirection() { return changeDirection; }
    public void setChangeDirection(ChangeDirection changeDirection) { this.changeDirection = changeDirection; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public SuggestionStatus getStatus() { return status; }
    public void setStatus(SuggestionStatus status) { this.status = status; }

    public TriggerReason getTriggerReason() { return triggerReason; }
    public void setTriggerReason(TriggerReason triggerReason) { this.triggerReason = triggerReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
}


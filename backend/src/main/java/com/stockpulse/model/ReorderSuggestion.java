package com.stockpulse.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reorder_suggestions")
public class ReorderSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;

    @Column(name = "recommended_quantity", nullable = false)
    private Integer recommendedQuantity;

    @Column(name = "suggested_lead_time_days", nullable = false)
    private Integer suggestedLeadTimeDays;

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

    public ReorderSuggestion() {}

    public ReorderSuggestion(Long id, Product product, Integer currentStock, Integer recommendedQuantity,
                             Integer suggestedLeadTimeDays, Double confidence, String reasoning,
                             SuggestionStatus status, TriggerReason triggerReason,
                             LocalDateTime createdAt, LocalDateTime decidedAt) {
        this.id = id;
        this.product = product;
        this.currentStock = currentStock;
        this.recommendedQuantity = recommendedQuantity;
        this.suggestedLeadTimeDays = suggestedLeadTimeDays;
        this.confidence = confidence;
        this.reasoning = reasoning;
        this.status = status;
        this.triggerReason = triggerReason;
        this.createdAt = createdAt;
        this.decidedAt = decidedAt;
    }

    public static ReorderSuggestionBuilder builder() {
        return new ReorderSuggestionBuilder();
    }

    public static class ReorderSuggestionBuilder {
        private Long id;
        private Product product;
        private Integer currentStock;
        private Integer recommendedQuantity;
        private Integer suggestedLeadTimeDays;
        private Double confidence;
        private String reasoning;
        private SuggestionStatus status;
        private TriggerReason triggerReason;
        private LocalDateTime createdAt;
        private LocalDateTime decidedAt;

        public ReorderSuggestionBuilder id(Long id) { this.id = id; return this; }
        public ReorderSuggestionBuilder product(Product product) { this.product = product; return this; }
        public ReorderSuggestionBuilder currentStock(Integer currentStock) { this.currentStock = currentStock; return this; }
        public ReorderSuggestionBuilder recommendedQuantity(Integer recommendedQuantity) { this.recommendedQuantity = recommendedQuantity; return this; }
        public ReorderSuggestionBuilder suggestedLeadTimeDays(Integer suggestedLeadTimeDays) { this.suggestedLeadTimeDays = suggestedLeadTimeDays; return this; }
        public ReorderSuggestionBuilder confidence(Double confidence) { this.confidence = confidence; return this; }
        public ReorderSuggestionBuilder reasoning(String reasoning) { this.reasoning = reasoning; return this; }
        public ReorderSuggestionBuilder status(SuggestionStatus status) { this.status = status; return this; }
        public ReorderSuggestionBuilder triggerReason(TriggerReason triggerReason) { this.triggerReason = triggerReason; return this; }
        public ReorderSuggestionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ReorderSuggestionBuilder decidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; return this; }

        public ReorderSuggestion build() {
            return new ReorderSuggestion(id, product, currentStock, recommendedQuantity, suggestedLeadTimeDays,
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

    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }

    public Integer getRecommendedQuantity() { return recommendedQuantity; }
    public void setRecommendedQuantity(Integer recommendedQuantity) { this.recommendedQuantity = recommendedQuantity; }

    public Integer getSuggestedLeadTimeDays() { return suggestedLeadTimeDays; }
    public void setSuggestedLeadTimeDays(Integer suggestedLeadTimeDays) { this.suggestedLeadTimeDays = suggestedLeadTimeDays; }

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


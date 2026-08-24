package com.stockpulse.engine;

import com.stockpulse.model.ChangeDirection;

public class PricingRecommendation {
    private Double recommendedPrice;
    private ChangeDirection changeDirection;
    private Double confidence;
    private String reasoning;
    private String strategyUsed;

    public PricingRecommendation() {}

    public PricingRecommendation(Double recommendedPrice, ChangeDirection changeDirection, Double confidence, String reasoning, String strategyUsed) {
        this.recommendedPrice = recommendedPrice;
        this.changeDirection = changeDirection;
        this.confidence = confidence;
        this.reasoning = reasoning;
        this.strategyUsed = strategyUsed;
    }

    public static PricingRecommendationBuilder builder() {
        return new PricingRecommendationBuilder();
    }

    public static class PricingRecommendationBuilder {
        private Double recommendedPrice;
        private ChangeDirection changeDirection;
        private Double confidence;
        private String reasoning;
        private String strategyUsed;

        public PricingRecommendationBuilder recommendedPrice(Double recommendedPrice) { this.recommendedPrice = recommendedPrice; return this; }
        public PricingRecommendationBuilder changeDirection(ChangeDirection changeDirection) { this.changeDirection = changeDirection; return this; }
        public PricingRecommendationBuilder confidence(Double confidence) { this.confidence = confidence; return this; }
        public PricingRecommendationBuilder reasoning(String reasoning) { this.reasoning = reasoning; return this; }
        public PricingRecommendationBuilder strategyUsed(String strategyUsed) { this.strategyUsed = strategyUsed; return this; }

        public PricingRecommendation build() {
            return new PricingRecommendation(recommendedPrice, changeDirection, confidence, reasoning, strategyUsed);
        }
    }

    public Double getRecommendedPrice() { return recommendedPrice; }
    public void setRecommendedPrice(Double recommendedPrice) { this.recommendedPrice = recommendedPrice; }

    public ChangeDirection getChangeDirection() { return changeDirection; }
    public void setChangeDirection(ChangeDirection changeDirection) { this.changeDirection = changeDirection; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public String getStrategyUsed() { return strategyUsed; }
    public void setStrategyUsed(String strategyUsed) { this.strategyUsed = strategyUsed; }
}


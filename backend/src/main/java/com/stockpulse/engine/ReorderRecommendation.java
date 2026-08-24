package com.stockpulse.engine;

public class ReorderRecommendation {
    private Integer recommendedQuantity;
    private Integer suggestedLeadTimeDays;
    private Double confidence;
    private String reasoning;
    private String strategyUsed;

    public ReorderRecommendation() {}

    public ReorderRecommendation(Integer recommendedQuantity, Integer suggestedLeadTimeDays, Double confidence, String reasoning, String strategyUsed) {
        this.recommendedQuantity = recommendedQuantity;
        this.suggestedLeadTimeDays = suggestedLeadTimeDays;
        this.confidence = confidence;
        this.reasoning = reasoning;
        this.strategyUsed = strategyUsed;
    }

    public static ReorderRecommendationBuilder builder() {
        return new ReorderRecommendationBuilder();
    }

    public static class ReorderRecommendationBuilder {
        private Integer recommendedQuantity;
        private Integer suggestedLeadTimeDays;
        private Double confidence;
        private String reasoning;
        private String strategyUsed;

        public ReorderRecommendationBuilder recommendedQuantity(Integer recommendedQuantity) { this.recommendedQuantity = recommendedQuantity; return this; }
        public ReorderRecommendationBuilder suggestedLeadTimeDays(Integer suggestedLeadTimeDays) { this.suggestedLeadTimeDays = suggestedLeadTimeDays; return this; }
        public ReorderRecommendationBuilder confidence(Double confidence) { this.confidence = confidence; return this; }
        public ReorderRecommendationBuilder reasoning(String reasoning) { this.reasoning = reasoning; return this; }
        public ReorderRecommendationBuilder strategyUsed(String strategyUsed) { this.strategyUsed = strategyUsed; return this; }

        public ReorderRecommendation build() {
            return new ReorderRecommendation(recommendedQuantity, suggestedLeadTimeDays, confidence, reasoning, strategyUsed);
        }
    }

    public Integer getRecommendedQuantity() { return recommendedQuantity; }
    public void setRecommendedQuantity(Integer recommendedQuantity) { this.recommendedQuantity = recommendedQuantity; }

    public Integer getSuggestedLeadTimeDays() { return suggestedLeadTimeDays; }
    public void setSuggestedLeadTimeDays(Integer suggestedLeadTimeDays) { this.suggestedLeadTimeDays = suggestedLeadTimeDays; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public String getStrategyUsed() { return strategyUsed; }
    public void setStrategyUsed(String strategyUsed) { this.strategyUsed = strategyUsed; }
}


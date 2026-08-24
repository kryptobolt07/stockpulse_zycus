package com.stockpulse.engine;

public class CombinedRecommendation {
    private PricingRecommendation pricing;
    private ReorderRecommendation reorder;

    public CombinedRecommendation() {}

    public CombinedRecommendation(PricingRecommendation pricing, ReorderRecommendation reorder) {
        this.pricing = pricing;
        this.reorder = reorder;
    }

    public static CombinedRecommendationBuilder builder() {
        return new CombinedRecommendationBuilder();
    }

    public static class CombinedRecommendationBuilder {
        private PricingRecommendation pricing;
        private ReorderRecommendation reorder;

        public CombinedRecommendationBuilder pricing(PricingRecommendation pricing) { this.pricing = pricing; return this; }
        public CombinedRecommendationBuilder reorder(ReorderRecommendation reorder) { this.reorder = reorder; return this; }

        public CombinedRecommendation build() {
            return new CombinedRecommendation(pricing, reorder);
        }
    }

    public PricingRecommendation getPricing() { return pricing; }
    public void setPricing(PricingRecommendation pricing) { this.pricing = pricing; }

    public ReorderRecommendation getReorder() { return reorder; }
    public void setReorder(ReorderRecommendation reorder) { this.reorder = reorder; }
}


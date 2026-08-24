package com.stockpulse.engine;

import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;

public interface CommerceAdvisor {
    CombinedRecommendation evaluate(Product product, TriggerReason trigger, CategoryContext context);
    PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context);
    ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context);
    String getStrategyName();
}


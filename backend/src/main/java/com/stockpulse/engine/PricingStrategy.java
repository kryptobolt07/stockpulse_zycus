package com.stockpulse.engine;

import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;

public interface PricingStrategy {
    PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context);
    String getStrategyName();
}


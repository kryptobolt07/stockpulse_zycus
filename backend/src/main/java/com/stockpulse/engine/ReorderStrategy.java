package com.stockpulse.engine;

import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;

public interface ReorderStrategy {
    ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context);
    String getStrategyName();
}


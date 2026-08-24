package com.stockpulse.engine.ai;

import com.stockpulse.ai.AiCommerceAdvisor;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.ReorderRecommendation;
import com.stockpulse.engine.ReorderStrategy;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("aiReorderStrategy")
public class AiReorderStrategy implements ReorderStrategy {

    private final AiCommerceAdvisor aiCommerceAdvisor;

    @Autowired
    public AiReorderStrategy(AiCommerceAdvisor aiCommerceAdvisor) {
        this.aiCommerceAdvisor = aiCommerceAdvisor;
    }

    @Override
    public ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context) {
        return aiCommerceAdvisor.evaluateReorder(product, trigger, context);
    }

    @Override
    public String getStrategyName() {
        return "AI_POWERED";
    }
}


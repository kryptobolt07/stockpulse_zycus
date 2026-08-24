package com.stockpulse.engine.ai;

import com.stockpulse.ai.AiCommerceAdvisor;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.PricingStrategy;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("aiPricingStrategy")
public class AiPricingStrategy implements PricingStrategy {

    private final AiCommerceAdvisor aiCommerceAdvisor;

    @Autowired
    public AiPricingStrategy(AiCommerceAdvisor aiCommerceAdvisor) {
        this.aiCommerceAdvisor = aiCommerceAdvisor;
    }

    @Override
    public PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context) {
        return aiCommerceAdvisor.evaluatePricing(product, trigger, context);
    }

    @Override
    public String getStrategyName() {
        return "AI_POWERED";
    }
}


package com.stockpulse.engine.rule;

import com.stockpulse.engine.*;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("ruleBasedCommerceAdvisor")
public class RuleBasedCommerceAdvisor implements CommerceAdvisor {

    private final RuleBasedPricingStrategy pricingStrategy;
    private final RuleBasedReorderStrategy reorderStrategy;

    @Autowired
    public RuleBasedCommerceAdvisor(RuleBasedPricingStrategy pricingStrategy, RuleBasedReorderStrategy reorderStrategy) {
        this.pricingStrategy = pricingStrategy;
        this.reorderStrategy = reorderStrategy;
    }

    @Override
    public CombinedRecommendation evaluate(Product product, TriggerReason trigger, CategoryContext context) {
        PricingRecommendation pricing = pricingStrategy.evaluatePricing(product, trigger, context);
        ReorderRecommendation reorder = reorderStrategy.evaluateReorder(product, trigger, context);
        return CombinedRecommendation.builder()
                .pricing(pricing)
                .reorder(reorder)
                .build();
    }

    @Override
    public PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context) {
        return pricingStrategy.evaluatePricing(product, trigger, context);
    }

    @Override
    public ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context) {
        return reorderStrategy.evaluateReorder(product, trigger, context);
    }

    @Override
    public String getStrategyName() {
        return "RULE_BASED";
    }
}


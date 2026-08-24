package com.stockpulse.engine.rule;

import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.ReorderRecommendation;
import com.stockpulse.engine.ReorderStrategy;
import com.stockpulse.model.Category;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.stereotype.Component;

@Component("ruleBasedReorderStrategy")
public class RuleBasedReorderStrategy implements ReorderStrategy {

    @Override
    public ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context) {
        int stock = product.getStockLevel() != null ? product.getStockLevel() : 0;
        int threshold = product.getReorderThreshold() != null ? product.getReorderThreshold() : 0;

        int targetQuantity = Math.max(1, (threshold * 3) - stock);
        int leadTimeDays = getCategoryLeadTime(product.getCategory());

        String triggerNote = trigger != null ? trigger.name() : "MANUAL";
        String reasoning = String.format(
                "Rule-Based Replenishment [Trigger: %s]: Current stock is %d against threshold %d. " +
                "Targeting 3x safety stock buffer (%d units). Recommended reorder quantity: %d units with estimated %d-day lead time.",
                triggerNote, stock, threshold, (threshold * 3), targetQuantity, leadTimeDays);

        return ReorderRecommendation.builder()
                .recommendedQuantity(targetQuantity)
                .suggestedLeadTimeDays(leadTimeDays)
                .confidence(0.85)
                .reasoning(reasoning)
                .strategyUsed(getStrategyName())
                .build();
    }

    @Override
    public String getStrategyName() {
        return "RULE_BASED";
    }

    private int getCategoryLeadTime(Category category) {
        if (category == null) return 7;
        return switch (category) {
            case ELECTRONICS -> 5;
            case APPAREL -> 7;
            case HOME -> 10;
        };
    }
}


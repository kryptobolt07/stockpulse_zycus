package com.stockpulse.engine.rule;

import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.PricingStrategy;
import com.stockpulse.model.ChangeDirection;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component("ruleBasedPricingStrategy")
public class RuleBasedPricingStrategy implements PricingStrategy {

    @Override
    public PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context) {
        double currentPrice = product.getCurrentPrice() != null ? product.getCurrentPrice() : 0.0;
        int stock = product.getStockLevel() != null ? product.getStockLevel() : 0;
        int threshold = product.getReorderThreshold() != null ? product.getReorderThreshold() : 0;
        int velocity = product.getDemandVelocity() != null ? product.getDemandVelocity() : 0;
        double categoryAvg = context != null ? context.getCategoryAvgVelocity() : 5.0;

        if (stock < threshold) {
            double recommended = round(currentPrice * 1.10);
            return PricingRecommendation.builder()
                    .recommendedPrice(recommended)
                    .changeDirection(ChangeDirection.INCREASE)
                    .confidence(0.85)
                    .reasoning(String.format(
                            "Rule-Based Trigger [INVENTORY_LOW]: Stock level (%d) is below reorder threshold (%d). " +
                            "Applied +10%% defensive price increase from $%.2f to $%.2f to throttle demand velocity and protect stock.",
                            stock, threshold, currentPrice, recommended))
                    .strategyUsed(getStrategyName())
                    .build();
        } else if (velocity > (2.0 * categoryAvg)) {
            double recommended = round(currentPrice * 1.05);
            return PricingRecommendation.builder()
                    .recommendedPrice(recommended)
                    .changeDirection(ChangeDirection.INCREASE)
                    .confidence(0.80)
                    .reasoning(String.format(
                            "Rule-Based Trigger [DEMAND_SPIKE]: Demand velocity (%d orders/24h) exceeds 2x category benchmark (%.1f). " +
                            "Applied +5%% surge price increase from $%.2f to $%.2f to capture consumer surplus.",
                            velocity, categoryAvg, currentPrice, recommended))
                    .strategyUsed(getStrategyName())
                    .build();
        } else {
            return PricingRecommendation.builder()
                    .recommendedPrice(currentPrice)
                    .changeDirection(ChangeDirection.HOLD)
                    .confidence(0.90)
                    .reasoning(String.format(
                            "Rule-Based Baseline: Inventory (%d units) and velocity (%d/24h) are within balanced operating bands for category %s. " +
                            "Recommended HOLD current price at $%.2f.",
                            stock, velocity, product.getCategory(), currentPrice))
                    .strategyUsed(getStrategyName())
                    .build();
        }
    }

    @Override
    public String getStrategyName() {
        return "RULE_BASED";
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}


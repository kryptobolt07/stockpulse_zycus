package com.stockpulse.ai;

import com.stockpulse.engine.CategoryContext;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilder {

    public String buildUnifiedPrompt(Product product, TriggerReason trigger, CategoryContext context) {
        String triggerSpecificGuidance = getTriggerSpecificGuidance(trigger);

        return String.format("""
            You are an expert E-Commerce Merchandising & Dynamic Pricing AI Advisor for ShopStream.
            Your task is to analyze the inventory situation and produce actionable dynamic pricing and replenishment recommendations.

            PRODUCT DETAILS:
            - SKU: %s
            - Product Name: %s
            - Category: %s
            - Current Live Price: $%.2f
            - Current Stock Level: %d units
            - Reorder Threshold: %d units
            - 24-Hour Demand Velocity: %d orders/day
            - Category Average Velocity: %.1f orders/day
            - Category Total SKUs: %d

            TRIGGER SITUATION: %s
            %s

            MERCHANDISING OBJECTIVES:
            1. Pricing Recommendation: Determine whether to INCREASE, DECREASE, or HOLD price.
               - Calculate the exact recommended price (USD, 2 decimals).
               - Provide a confidence score (0.0 to 1.0).
               - Provide plain-English executive reasoning explaining the trade-offs (e.g. stock preservation vs unit margin vs sales elasticity).
            2. Reorder Recommendation: Determine optimal reorder batch quantity.
               - Calculate recommended integer units to reorder.
               - Estimate suggested supplier lead time in days (typically 3-14 days).
               - Provide confidence score (0.0 to 1.0) and replenishment rationale.

            RESPONSE FORMAT:
            You MUST return ONLY valid JSON matching this exact structure with no markdown or formatting wrappers outside the JSON:
            {
              "pricing": {
                "recommendedPrice": 0.00,
                "changeDirection": "INCREASE" | "DECREASE" | "HOLD",
                "confidence": 0.85,
                "reasoning": "Clear explanation of pricing logic and elasticity tradeoffs."
              },
              "reorder": {
                "recommendedQuantity": 0,
                "suggestedLeadTimeDays": 5,
                "confidence": 0.85,
                "reasoning": "Clear explanation of replenishment quantity and velocity burn-down."
              }
            }
            """,
                product.getSku(),
                product.getName(),
                product.getCategory(),
                product.getCurrentPrice(),
                product.getStockLevel(),
                product.getReorderThreshold(),
                product.getDemandVelocity(),
                context != null ? context.getCategoryAvgVelocity() : 5.0,
                context != null ? context.getTotalProductsInCategory() : 5,
                trigger != null ? trigger.name() : "MANUAL",
                triggerSpecificGuidance
        );
    }

    public String buildPricingOnlyPrompt(Product product, TriggerReason trigger, CategoryContext context) {
        String triggerSpecificGuidance = getTriggerSpecificGuidance(trigger);

        return String.format("""
            You are an expert E-Commerce Merchandising & Dynamic Pricing AI Advisor for ShopStream.
            Your task is to analyze the inventory situation and produce an optimal dynamic pricing recommendation.

            PRODUCT DETAILS:
            - SKU: %s
            - Product Name: %s
            - Category: %s
            - Current Live Price: $%.2f
            - Current Stock Level: %d units
            - Reorder Threshold: %d units
            - 24-Hour Demand Velocity: %d orders/day
            - Category Average Velocity: %.1f orders/day

            TRIGGER SITUATION: %s
            %s

            RESPONSE FORMAT:
            Return ONLY valid JSON:
            {
              "recommendedPrice": 0.00,
              "changeDirection": "INCREASE" | "DECREASE" | "HOLD",
              "confidence": 0.85,
              "reasoning": "Clear explanation of pricing logic, price elasticity, and risk evaluation."
            }
            """,
                product.getSku(),
                product.getName(),
                product.getCategory(),
                product.getCurrentPrice(),
                product.getStockLevel(),
                product.getReorderThreshold(),
                product.getDemandVelocity(),
                context != null ? context.getCategoryAvgVelocity() : 5.0,
                trigger != null ? trigger.name() : "MANUAL",
                triggerSpecificGuidance
        );
    }

    public String buildReorderOnlyPrompt(Product product, TriggerReason trigger, CategoryContext context) {
        return String.format("""
            You are an expert E-Commerce Supply Chain & Inventory Replenishment AI Advisor.
            Your task is to analyze stock depletion rates and recommend an optimal purchase reorder batch.

            PRODUCT DETAILS:
            - SKU: %s
            - Product Name: %s
            - Category: %s
            - Current Stock Level: %d units
            - Reorder Threshold: %d units
            - 24-Hour Demand Velocity: %d orders/day
            - Category Average Velocity: %.1f orders/day

            TRIGGER: %s

            RESPONSE FORMAT:
            Return ONLY valid JSON:
            {
              "recommendedQuantity": 0,
              "suggestedLeadTimeDays": 5,
              "confidence": 0.85,
              "reasoning": "Detailed breakdown of buffer days, daily run-rate, and supplier lead time."
            }
            """,
                product.getSku(),
                product.getName(),
                product.getCategory(),
                product.getStockLevel(),
                product.getReorderThreshold(),
                product.getDemandVelocity(),
                context != null ? context.getCategoryAvgVelocity() : 5.0,
                trigger != null ? trigger.name() : "MANUAL"
        );
    }

    private String getTriggerSpecificGuidance(TriggerReason trigger) {
        if (trigger == null) return "Evaluate standard baseline pricing.";
        return switch (trigger) {
            case INVENTORY_LOW -> """
                [INVENTORY_LOW CRITICAL ADVISORY]:
                Stock has breached the safety threshold. You face a genuine merchandising trade-off:
                Option A: Increase price defensively by 8%-18% to slow down velocity, protect remaining inventory, and capture higher gross margins before stockout.
                Option B: If the item is seasonal or lagging, discount for clearance.
                Explain which path you chose and why in your reasoning. Ensure reorder quantity restores at least 3-4 weeks of safety stock.
                """;
            case DEMAND_SPIKE -> """
                [DEMAND_SPIKE VIRAL SURGE ADVISORY]:
                Demand velocity has surged significantly above category peers.
                Capitalize on consumer willingness to pay with a modest, elastic price increase (4%-12%) while demand intensity is high.
                Ensure replenishment quantity scales up to avoid immediate stockouts under sustained velocity.
                """;
            case INITIAL, MANUAL -> """
                [ON-DEMAND AUDIT]:
                Evaluate price elasticity, inventory buffer balance, and category velocity benchmarks.
                """;
        };
    }
}


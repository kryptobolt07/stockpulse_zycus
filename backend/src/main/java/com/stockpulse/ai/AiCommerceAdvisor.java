package com.stockpulse.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpulse.engine.*;
import com.stockpulse.engine.rule.RuleBasedCommerceAdvisor;
import com.stockpulse.model.ChangeDirection;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component("aiCommerceAdvisor")
public class AiCommerceAdvisor implements CommerceAdvisor {

    private static final Logger log = LoggerFactory.getLogger(AiCommerceAdvisor.class);

    private final LLMGateway llmGateway;
    private final PromptBuilder promptBuilder;
    private final RuleBasedCommerceAdvisor fallbackAdvisor;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public AiCommerceAdvisor(LLMGateway llmGateway,
                              PromptBuilder promptBuilder,
                              RuleBasedCommerceAdvisor fallbackAdvisor) {
        this.llmGateway = llmGateway;
        this.promptBuilder = promptBuilder;
        this.fallbackAdvisor = fallbackAdvisor;
    }

    @Override
    public CombinedRecommendation evaluate(Product product, TriggerReason trigger, CategoryContext context) {
        try {
            String prompt = promptBuilder.buildUnifiedPrompt(product, trigger, context);
            String rawResponse = llmGateway.callLLM(prompt);
            String cleanJson = extractJson(rawResponse);

            JsonNode root = mapper.readTree(cleanJson);
            JsonNode pricingNode = root.path("pricing");
            JsonNode reorderNode = root.path("reorder");

            PricingRecommendation pricing = parsePricingNode(pricingNode, product, trigger, context);
            ReorderRecommendation reorder = parseReorderNode(reorderNode, product, trigger, context);

            return CombinedRecommendation.builder()
                    .pricing(pricing)
                    .reorder(reorder)
                    .build();
        } catch (Exception e) {
            log.warn("AI unified evaluation failed for product {}: {}. Falling back to Rule-Based Strategy.", 
                    product.getId(), e.getMessage());
            return getFallbackCombined(product, trigger, context, e.getMessage());
        }
    }

    @Override
    public PricingRecommendation evaluatePricing(Product product, TriggerReason trigger, CategoryContext context) {
        try {
            String prompt = promptBuilder.buildPricingOnlyPrompt(product, trigger, context);
            String rawResponse = llmGateway.callLLM(prompt);
            String cleanJson = extractJson(rawResponse);

            JsonNode pricingNode = mapper.readTree(cleanJson);
            return parsePricingNode(pricingNode, product, trigger, context);
        } catch (Exception e) {
            log.warn("AI pricing evaluation failed for product {}: {}. Falling back to Rule-Based Strategy.", 
                    product.getId(), e.getMessage());
            PricingRecommendation fallback = fallbackAdvisor.evaluatePricing(product, trigger, context);
            fallback.setReasoning("[AI Fallback: " + e.getMessage() + "] " + fallback.getReasoning());
            return fallback;
        }
    }

    @Override
    public ReorderRecommendation evaluateReorder(Product product, TriggerReason trigger, CategoryContext context) {
        try {
            String prompt = promptBuilder.buildReorderOnlyPrompt(product, trigger, context);
            String rawResponse = llmGateway.callLLM(prompt);
            String cleanJson = extractJson(rawResponse);

            JsonNode reorderNode = mapper.readTree(cleanJson);
            return parseReorderNode(reorderNode, product, trigger, context);
        } catch (Exception e) {
            log.warn("AI reorder evaluation failed for product {}: {}. Falling back to Rule-Based Strategy.", 
                    product.getId(), e.getMessage());
            ReorderRecommendation fallback = fallbackAdvisor.evaluateReorder(product, trigger, context);
            fallback.setReasoning("[AI Fallback: " + e.getMessage() + "] " + fallback.getReasoning());
            return fallback;
        }
    }

    @Override
    public String getStrategyName() {
        return "AI_POWERED";
    }

    private PricingRecommendation parsePricingNode(JsonNode node, Product product, TriggerReason trigger, CategoryContext context) {
        if (node == null || node.isMissingNode()) {
            throw new IllegalArgumentException("Missing 'pricing' object in AI response");
        }

        double currentPrice = product.getCurrentPrice() != null ? product.getCurrentPrice() : 0.0;
        double recommendedPrice = node.path("recommendedPrice").asDouble(currentPrice);
        String directionStr = node.path("changeDirection").asText("HOLD");
        double confidence = node.path("confidence").asDouble(0.85);
        String reasoning = node.path("reasoning").asText("AI-generated dynamic pricing recommendation.");

        // Sane Bounds Validation:
        // Price must be positive and between 30% and 300% of current price
        if (recommendedPrice <= 0 || recommendedPrice < (0.3 * currentPrice) || recommendedPrice > (3.0 * currentPrice)) {
            log.warn("AI suggested out-of-bounds price ${} for product {} with current price ${}. Clamping/Falling back.",
                    recommendedPrice, product.getId(), currentPrice);
            PricingRecommendation fallback = fallbackAdvisor.evaluatePricing(product, trigger, context);
            fallback.setReasoning(String.format("[Sanity Check Clamped: AI price $%.2f was out of bounds] %s", recommendedPrice, fallback.getReasoning()));
            return fallback;
        }

        ChangeDirection direction;
        try {
            direction = ChangeDirection.valueOf(directionStr.toUpperCase());
        } catch (Exception ignored) {
            direction = recommendedPrice > currentPrice ? ChangeDirection.INCREASE 
                    : (recommendedPrice < currentPrice ? ChangeDirection.DECREASE : ChangeDirection.HOLD);
        }

        return PricingRecommendation.builder()
                .recommendedPrice(round(recommendedPrice))
                .changeDirection(direction)
                .confidence(Math.min(1.0, Math.max(0.0, confidence)))
                .reasoning(reasoning)
                .strategyUsed(getStrategyName())
                .build();
    }

    private ReorderRecommendation parseReorderNode(JsonNode node, Product product, TriggerReason trigger, CategoryContext context) {
        if (node == null || node.isMissingNode()) {
            throw new IllegalArgumentException("Missing 'reorder' object in AI response");
        }

        int threshold = product.getReorderThreshold() != null ? product.getReorderThreshold() : 10;
        int recommendedQty = node.path("recommendedQuantity").asInt(threshold * 2);
        int leadTime = node.path("suggestedLeadTimeDays").asInt(7);
        double confidence = node.path("confidence").asDouble(0.85);
        String reasoning = node.path("reasoning").asText("AI-generated replenishment schedule.");

        // Sane Bounds Validation:
        // Recommended quantity must be positive and <= 50x reorder threshold
        if (recommendedQty <= 0 || recommendedQty > (50 * threshold)) {
            log.warn("AI suggested out-of-bounds reorder quantity {} for product {} with threshold {}. Clamping/Falling back.",
                    recommendedQty, product.getId(), threshold);
            ReorderRecommendation fallback = fallbackAdvisor.evaluateReorder(product, trigger, context);
            fallback.setReasoning(String.format("[Sanity Check Clamped: AI quantity %d was out of bounds] %s", recommendedQty, fallback.getReasoning()));
            return fallback;
        }

        return ReorderRecommendation.builder()
                .recommendedQuantity(recommendedQty)
                .suggestedLeadTimeDays(Math.max(1, Math.min(60, leadTime)))
                .confidence(Math.min(1.0, Math.max(0.0, confidence)))
                .reasoning(reasoning)
                .strategyUsed(getStrategyName())
                .build();
    }

    private CombinedRecommendation getFallbackCombined(Product product, TriggerReason trigger, CategoryContext context, String reason) {
        CombinedRecommendation fallback = fallbackAdvisor.evaluate(product, trigger, context);
        fallback.getPricing().setReasoning("[AI Fallback: " + reason + "] " + fallback.getPricing().getReasoning());
        fallback.getReorder().setReasoning("[AI Fallback: " + reason + "] " + fallback.getReorder().getReasoning());
        return fallback;
    }

    private String extractJson(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private double round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}


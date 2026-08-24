package com.stockpulse.engine;

import com.stockpulse.ai.AiCommerceAdvisor;
import com.stockpulse.engine.ai.AiPricingStrategy;
import com.stockpulse.engine.ai.AiReorderStrategy;
import com.stockpulse.engine.rule.RuleBasedCommerceAdvisor;
import com.stockpulse.engine.rule.RuleBasedPricingStrategy;
import com.stockpulse.engine.rule.RuleBasedReorderStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class StrategyRegistry {

    private static final Logger log = LoggerFactory.getLogger(StrategyRegistry.class);

    private final RuleBasedPricingStrategy rulePricing;
    private final RuleBasedReorderStrategy ruleReorder;
    private final RuleBasedCommerceAdvisor ruleAdvisor;

    private final AiPricingStrategy aiPricing;
    private final AiReorderStrategy aiReorder;
    private final AiCommerceAdvisor aiAdvisor;

    private final AtomicReference<String> activeMode = new AtomicReference<>("AI_POWERED");

    @Autowired
    public StrategyRegistry(RuleBasedPricingStrategy rulePricing,
                            RuleBasedReorderStrategy ruleReorder,
                            RuleBasedCommerceAdvisor ruleAdvisor,
                            AiPricingStrategy aiPricing,
                            AiReorderStrategy aiReorder,
                            AiCommerceAdvisor aiAdvisor,
                            @Value("${commerce.strategy.active:AI_POWERED}") String defaultMode) {
        this.rulePricing = rulePricing;
        this.ruleReorder = ruleReorder;
        this.ruleAdvisor = ruleAdvisor;
        this.aiPricing = aiPricing;
        this.aiReorder = aiReorder;
        this.aiAdvisor = aiAdvisor;
        setActiveMode(defaultMode);
    }

    public String getActiveMode() {
        return activeMode.get();
    }

    public void setActiveMode(String mode) {
        if (mode == null) return;
        String normalized = mode.trim().toUpperCase();
        if (normalized.equals("RULE_BASED") || normalized.equals("AI_POWERED")) {
            this.activeMode.set(normalized);
            log.info("Active commerce strategy switched at runtime to: {}", normalized);
        } else {
            throw new IllegalArgumentException("Unknown strategy mode: " + mode + ". Must be RULE_BASED or AI_POWERED.");
        }
    }

    public PricingStrategy getActivePricingStrategy() {
        return isAiMode() ? aiPricing : rulePricing;
    }

    public ReorderStrategy getActiveReorderStrategy() {
        return isAiMode() ? aiReorder : ruleReorder;
    }

    public CommerceAdvisor getActiveAdvisor() {
        return isAiMode() ? aiAdvisor : ruleAdvisor;
    }

    public boolean isAiMode() {
        return "AI_POWERED".equalsIgnoreCase(activeMode.get());
    }

    public List<String> getAvailableStrategies() {
        return List.of("AI_POWERED", "RULE_BASED");
    }
}


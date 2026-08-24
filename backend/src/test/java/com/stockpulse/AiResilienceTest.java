package com.stockpulse;

import com.stockpulse.ai.AiCommerceAdvisor;
import com.stockpulse.ai.LLMGateway;
import com.stockpulse.ai.PromptBuilder;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.CombinedRecommendation;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.rule.RuleBasedCommerceAdvisor;
import com.stockpulse.engine.rule.RuleBasedPricingStrategy;
import com.stockpulse.engine.rule.RuleBasedReorderStrategy;
import com.stockpulse.model.Category;
import com.stockpulse.model.ChangeDirection;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

public class AiResilienceTest {

    private LLMGateway mockGateway;
    private AiCommerceAdvisor advisor;
    private RuleBasedCommerceAdvisor fallbackAdvisor;

    @BeforeEach
    void setUp() {
        mockGateway = Mockito.mock(LLMGateway.class);
        PromptBuilder promptBuilder = new PromptBuilder();
        RuleBasedPricingStrategy rulePricing = new RuleBasedPricingStrategy();
        RuleBasedReorderStrategy ruleReorder = new RuleBasedReorderStrategy();
        fallbackAdvisor = new RuleBasedCommerceAdvisor(rulePricing, ruleReorder);
        advisor = new AiCommerceAdvisor(mockGateway, promptBuilder, fallbackAdvisor);
    }

    @Test
    void testMalformedJsonFallsBackToRuleBased() {
        when(mockGateway.callLLM(anyString())).thenReturn("This is invalid non-json text from LLM");

        Product product = Product.builder()
                .id("PRD-001")
                .name("Product 1")
                .category(Category.ELECTRONICS)
                .currentPrice(50.00)
                .stockLevel(4)
                .reorderThreshold(10)
                .demandVelocity(3)
                .build();

        CategoryContext context = CategoryContext.builder()
                .category(Category.ELECTRONICS)
                .categoryAvgVelocity(4.0)
                .build();

        CombinedRecommendation rec = advisor.evaluate(product, TriggerReason.INVENTORY_LOW, context);

        assertNotNull(rec);
        assertNotNull(rec.getPricing());
        assertNotNull(rec.getReorder());
        // Fallback rule applied: 50 * 1.10 = 55.00
        assertEquals(55.00, rec.getPricing().getRecommendedPrice());
        assertTrue(rec.getPricing().getReasoning().contains("AI Fallback"));
    }

    @Test
    void testAbsurdPriceRejectionAndFallback() {
        // LLM returns absurd 10x price $10,000 for a $50 item
        String absurdJson = """
            {
              "pricing": {
                "recommendedPrice": 10000.00,
                "changeDirection": "INCREASE",
                "confidence": 0.99,
                "reasoning": "Absurd hyper-surge price."
              },
              "reorder": {
                "recommendedQuantity": 20,
                "suggestedLeadTimeDays": 5,
                "confidence": 0.9,
                "reasoning": "Standard"
              }
            }
            """;
        when(mockGateway.callLLM(anyString())).thenReturn(absurdJson);

        Product product = Product.builder()
                .id("PRD-001")
                .name("Product 1")
                .category(Category.ELECTRONICS)
                .currentPrice(50.00)
                .stockLevel(5)
                .reorderThreshold(10)
                .build();

        CombinedRecommendation rec = advisor.evaluate(product, TriggerReason.INVENTORY_LOW, null);

        assertNotNull(rec);
        // Sane bounds clamped / fallback to +10% rule
        assertEquals(55.00, rec.getPricing().getRecommendedPrice());
        assertTrue(rec.getPricing().getReasoning().contains("Sanity Check Clamped") ||
                   rec.getPricing().getReasoning().contains("AI Fallback"));
    }

    @Test
    void testValidAiResponseParsing() {
        String validJson = """
            {
              "pricing": {
                "recommendedPrice": 56.99,
                "changeDirection": "INCREASE",
                "confidence": 0.92,
                "reasoning": "Optimal defensive price hike."
              },
              "reorder": {
                "recommendedQuantity": 40,
                "suggestedLeadTimeDays": 6,
                "confidence": 0.88,
                "reasoning": "Replenish buffer."
              }
            }
            """;
        when(mockGateway.callLLM(anyString())).thenReturn(validJson);

        Product product = Product.builder()
                .id("PRD-001")
                .name("Product 1")
                .category(Category.ELECTRONICS)
                .currentPrice(50.00)
                .stockLevel(5)
                .reorderThreshold(10)
                .build();

        CombinedRecommendation rec = advisor.evaluate(product, TriggerReason.INVENTORY_LOW, null);

        assertNotNull(rec);
        assertEquals(56.99, rec.getPricing().getRecommendedPrice());
        assertEquals(ChangeDirection.INCREASE, rec.getPricing().getChangeDirection());
        assertEquals(40, rec.getReorder().getRecommendedQuantity());
    }
}


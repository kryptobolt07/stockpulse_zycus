package com.stockpulse;

import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.ReorderRecommendation;
import com.stockpulse.engine.rule.RuleBasedPricingStrategy;
import com.stockpulse.engine.rule.RuleBasedReorderStrategy;
import com.stockpulse.model.Category;
import com.stockpulse.model.ChangeDirection;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CommerceStrategyTest {

    private RuleBasedPricingStrategy pricingStrategy;
    private RuleBasedReorderStrategy reorderStrategy;

    @BeforeEach
    void setUp() {
        pricingStrategy = new RuleBasedPricingStrategy();
        reorderStrategy = new RuleBasedReorderStrategy();
    }

    @Test
    void testInventoryLowTriggersTenPercentPriceIncrease() {
        Product product = Product.builder()
                .id("PRD-001")
                .sku("SKU-001")
                .name("Test Product")
                .category(Category.ELECTRONICS)
                .currentPrice(100.00)
                .stockLevel(5)
                .reorderThreshold(10)
                .demandVelocity(2)
                .build();

        CategoryContext context = CategoryContext.builder()
                .category(Category.ELECTRONICS)
                .categoryAvgVelocity(3.0)
                .build();

        PricingRecommendation rec = pricingStrategy.evaluatePricing(product, TriggerReason.INVENTORY_LOW, context);

        assertNotNull(rec);
        assertEquals(110.00, rec.getRecommendedPrice());
        assertEquals(ChangeDirection.INCREASE, rec.getChangeDirection());
        assertTrue(rec.getReasoning().contains("INVENTORY_LOW"));
    }

    @Test
    void testDemandSpikeTriggersFivePercentPriceIncrease() {
        Product product = Product.builder()
                .id("PRD-002")
                .sku("SKU-002")
                .name("Trending Product")
                .category(Category.APPAREL)
                .currentPrice(50.00)
                .stockLevel(30)
                .reorderThreshold(10)
                .demandVelocity(15) // > 2x 5.0
                .build();

        CategoryContext context = CategoryContext.builder()
                .category(Category.APPAREL)
                .categoryAvgVelocity(5.0)
                .build();

        PricingRecommendation rec = pricingStrategy.evaluatePricing(product, TriggerReason.DEMAND_SPIKE, context);

        assertNotNull(rec);
        assertEquals(52.50, rec.getRecommendedPrice());
        assertEquals(ChangeDirection.INCREASE, rec.getChangeDirection());
        assertTrue(rec.getReasoning().contains("DEMAND_SPIKE"));
    }

    @Test
    void testNormalConditionsHoldPrice() {
        Product product = Product.builder()
                .id("PRD-003")
                .sku("SKU-003")
                .name("Balanced Product")
                .category(Category.HOME)
                .currentPrice(40.00)
                .stockLevel(25)
                .reorderThreshold(10)
                .demandVelocity(3)
                .build();

        CategoryContext context = CategoryContext.builder()
                .category(Category.HOME)
                .categoryAvgVelocity(4.0)
                .build();

        PricingRecommendation rec = pricingStrategy.evaluatePricing(product, TriggerReason.MANUAL, context);

        assertNotNull(rec);
        assertEquals(40.00, rec.getRecommendedPrice());
        assertEquals(ChangeDirection.HOLD, rec.getChangeDirection());
    }

    @Test
    void testReorderQuantityCalculationFormula() {
        // formula: (reorderThreshold * 3) - currentStock
        Product product = Product.builder()
                .id("PRD-004")
                .category(Category.ELECTRONICS)
                .stockLevel(8)
                .reorderThreshold(15)
                .build();

        ReorderRecommendation rec = reorderStrategy.evaluateReorder(product, TriggerReason.INVENTORY_LOW, null);

        assertNotNull(rec);
        // (15 * 3) - 8 = 37
        assertEquals(37, rec.getRecommendedQuantity());
        assertEquals(5, rec.getSuggestedLeadTimeDays()); // Electronics lead time
    }
}


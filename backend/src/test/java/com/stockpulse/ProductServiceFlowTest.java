package com.stockpulse;

import com.stockpulse.model.*;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import com.stockpulse.service.PricingSuggestionService;
import com.stockpulse.service.ProductService;
import com.stockpulse.service.ReorderSuggestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ProductServiceFlowTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private PricingSuggestionRepository pricingRepo;

    @Autowired
    private ReorderSuggestionRepository reorderRepo;

    @Autowired
    private PricingSuggestionService pricingService;

    @Autowired
    private ReorderSuggestionService reorderService;

    @Test
    @Transactional
    void testOrderDecrementsStockAndSimulatedAcceptUpdatesPrice() {
        // Find seeded PRD-001 (price 79.99, stock 45)
        Product p = productRepo.findById("PRD-001").orElseThrow();
        assertEquals(79.99, p.getCurrentPrice());

        // Simulate order
        Product updated = productService.recordOrder("PRD-001", 5);
        assertEquals(40, updated.getStockLevel());
        assertEquals(8, updated.getDemandVelocity()); // 3 + 5

        // On-demand suggest pricing
        PricingSuggestion suggestion = productService.suggestPricing("PRD-001");
        assertNotNull(suggestion);
        assertEquals(SuggestionStatus.PENDING, suggestion.getStatus());

        // Accept pricing suggestion
        PricingSuggestion accepted = pricingService.decideSuggestion(suggestion.getId(), SuggestionStatus.ACCEPTED);
        assertEquals(SuggestionStatus.ACCEPTED, accepted.getStatus());

        Product finalProduct = productRepo.findById("PRD-001").orElseThrow();
        assertEquals(suggestion.getRecommendedPrice(), finalProduct.getCurrentPrice());
    }

    @Test
    @Transactional
    void testReorderSuggestionAcceptIncrementsStock() {
        Product p = productRepo.findById("PRD-002").orElseThrow();
        int initialStock = p.getStockLevel();

        ReorderSuggestion reorder = productService.suggestReorder("PRD-002");
        assertNotNull(reorder);
        assertEquals(SuggestionStatus.PENDING, reorder.getStatus());

        ReorderSuggestion accepted = reorderService.decideSuggestion(reorder.getId(), SuggestionStatus.ACCEPTED);
        assertEquals(SuggestionStatus.ACCEPTED, accepted.getStatus());

        Product finalProduct = productRepo.findById("PRD-002").orElseThrow();
        assertEquals(initialStock + reorder.getRecommendedQuantity(), finalProduct.getStockLevel());
    }
}


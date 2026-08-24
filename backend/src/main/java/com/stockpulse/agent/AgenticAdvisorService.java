package com.stockpulse.agent;

import com.stockpulse.ai.ActivityStreamService;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.CombinedRecommendation;
import com.stockpulse.engine.StrategyRegistry;
import com.stockpulse.model.*;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AgenticAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(AgenticAdvisorService.class);

    private final ProductRepository productRepository;
    private final PricingSuggestionRepository pricingRepo;
    private final ReorderSuggestionRepository reorderRepo;
    private final StrategyRegistry strategyRegistry;
    private final ActivityStreamService activityStreamService;

    @Autowired
    public AgenticAdvisorService(ProductRepository productRepository,
                                  PricingSuggestionRepository pricingRepo,
                                  ReorderSuggestionRepository reorderRepo,
                                  StrategyRegistry strategyRegistry,
                                  ActivityStreamService activityStreamService) {
        this.productRepository = productRepository;
        this.pricingRepo = pricingRepo;
        this.reorderRepo = reorderRepo;
        this.strategyRegistry = strategyRegistry;
        this.activityStreamService = activityStreamService;
    }

    @Transactional
    public void processInventorySignal(Product product, TriggerReason triggerReason) {
        if (product == null) return;

        log.info("Agentic Advisor Loop triggered for product {} [{}] with trigger: {}",
                product.getId(), product.getName(), triggerReason);

        // Deduplication & Idempotency: skip if pending suggestion for same product + triggerReason already exists
        boolean hasPendingPricing = pricingRepo.existsByProductIdAndTriggerReasonAndStatus(
                product.getId(), triggerReason, SuggestionStatus.PENDING);
        boolean hasPendingReorder = reorderRepo.existsByProductIdAndTriggerReasonAndStatus(
                product.getId(), triggerReason, SuggestionStatus.PENDING);

        if (hasPendingPricing && hasPendingReorder) {
            log.info("Agentic loop: Pending suggestions already exist for product {} and trigger {}. Skipping to prevent duplicate clutter.",
                    product.getId(), triggerReason);
            return;
        }

        // Notify real-time SSE stream that evaluation has started
        activityStreamService.emitEvaluationStart(product.getId(), product.getName(), triggerReason.name());

        try {
            // Build Category context
            Double categoryAvg = productRepository.getAverageDemandVelocityByCategory(product.getCategory());
            Double overallAvg = productRepository.getOverallAverageDemandVelocity();

            CategoryContext context = CategoryContext.builder()
                    .category(product.getCategory())
                    .categoryAvgVelocity(categoryAvg != null ? categoryAvg : 5.0)
                    .overallAvgVelocity(overallAvg != null ? overallAvg : 5.0)
                    .totalProductsInCategory(productRepository.findByCategory(product.getCategory()).size())
                    .build();

            // Run active advisor (LLM or Rule-Based)
            CombinedRecommendation rec = strategyRegistry.getActiveAdvisor().evaluate(product, triggerReason, context);

            // Persist Pricing Suggestion if not duplicate
            if (!hasPendingPricing && rec.getPricing() != null) {
                PricingSuggestion pricingSuggestion = PricingSuggestion.builder()
                        .product(product)
                        .currentPrice(product.getCurrentPrice())
                        .recommendedPrice(rec.getPricing().getRecommendedPrice())
                        .changeDirection(rec.getPricing().getChangeDirection())
                        .confidence(rec.getPricing().getConfidence())
                        .reasoning(rec.getPricing().getReasoning())
                        .status(SuggestionStatus.PENDING)
                        .triggerReason(triggerReason)
                        .createdAt(LocalDateTime.now())
                        .build();
                pricingRepo.save(pricingSuggestion);
                log.info("Created PENDING PricingSuggestion #{} for product {} ({})",
                        pricingSuggestion.getId(), product.getId(), rec.getPricing().getChangeDirection());
            }

            // Persist Reorder Suggestion if not duplicate
            if (!hasPendingReorder && rec.getReorder() != null) {
                ReorderSuggestion reorderSuggestion = ReorderSuggestion.builder()
                        .product(product)
                        .currentStock(product.getStockLevel())
                        .recommendedQuantity(rec.getReorder().getRecommendedQuantity())
                        .suggestedLeadTimeDays(rec.getReorder().getSuggestedLeadTimeDays())
                        .confidence(rec.getReorder().getConfidence())
                        .reasoning(rec.getReorder().getReasoning())
                        .status(SuggestionStatus.PENDING)
                        .triggerReason(triggerReason)
                        .createdAt(LocalDateTime.now())
                        .build();
                reorderRepo.save(reorderSuggestion);
                log.info("Created PENDING ReorderSuggestion #{} for product {} (qty: {})",
                        reorderSuggestion.getId(), product.getId(), rec.getReorder().getRecommendedQuantity());
            }

            // Update Product Lifecycle Status to PRICE_REVIEW_PENDING (unless out of stock)
            if (product.getStockLevel() == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            } else if (product.getStatus() != ProductStatus.PRICE_REVIEW_PENDING) {
                product.setStatus(ProductStatus.PRICE_REVIEW_PENDING);
            }
            productRepository.save(product);
        } finally {
            // Notify real-time SSE stream that evaluation is complete
            activityStreamService.emitEvaluationComplete(product.getId(), product.getName(), triggerReason.name());
        }
    }
}

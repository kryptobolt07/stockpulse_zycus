package com.stockpulse.service;

import com.stockpulse.agent.DemandSpikeEvent;
import com.stockpulse.agent.ProductStockEvent;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.ReorderRecommendation;
import com.stockpulse.engine.StrategyRegistry;
import com.stockpulse.model.*;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final PricingSuggestionRepository pricingRepo;
    private final ReorderSuggestionRepository reorderRepo;
    private final StrategyRegistry strategyRegistry;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public ProductService(ProductRepository productRepository,
                          PricingSuggestionRepository pricingRepo,
                          ReorderSuggestionRepository reorderRepo,
                          StrategyRegistry strategyRegistry,
                          ApplicationEventPublisher eventPublisher) {
        this.productRepository = productRepository;
        this.pricingRepo = pricingRepo;
        this.reorderRepo = reorderRepo;
        this.strategyRegistry = strategyRegistry;
        this.eventPublisher = eventPublisher;
    }

    public List<Product> getAllProducts(ProductStatus status, Category category, String search) {
        List<Product> products;
        if (status != null && category != null) {
            products = productRepository.findByStatusAndCategory(status, category);
        } else if (status != null) {
            products = productRepository.findByStatus(status);
        } else if (category != null) {
            products = productRepository.findByCategory(category);
        } else {
            products = productRepository.findAll();
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            return products.stream()
                    .filter(p -> p.getName().toLowerCase().contains(q) ||
                                 p.getSku().toLowerCase().contains(q) ||
                                 p.getId().toLowerCase().contains(q))
                    .toList();
        }
        return products;
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(Product product) {
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            product.setId("PRD-" + System.currentTimeMillis() % 100000);
        }
        if (product.getDemandVelocity() == null) {
            product.setDemandVelocity(0);
        }
        if (product.getStockLevel() != null && product.getStockLevel() == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (product.getStatus() == null) {
            product.setStatus(ProductStatus.ACTIVE);
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateStock(String id, int newStockLevel) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        int prevStock = product.getStockLevel();
        product.setStockLevel(Math.max(0, newStockLevel));

        if (product.getStockLevel() == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (product.getStatus() == ProductStatus.OUT_OF_STOCK && product.getStockLevel() > 0) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        Product saved = productRepository.save(product);
        log.info("Stock updated for product {}: {} -> {}", id, prevStock, product.getStockLevel());

        // Publish decoupled async event
        eventPublisher.publishEvent(new ProductStockEvent(this, saved, prevStock, saved.getStockLevel(), false));

        return saved;
    }

    @Transactional
    public Product recordOrder(String id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        int prevStock = product.getStockLevel();
        int newStock = Math.max(0, prevStock - quantity);
        product.setStockLevel(newStock);

        // Bump demand velocity
        product.setDemandVelocity((product.getDemandVelocity() != null ? product.getDemandVelocity() : 0) + quantity);

        if (newStock == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        }

        Product saved = productRepository.save(product);
        log.info("Order simulated for product {}: qty={}, stock {} -> {}, new velocity={}",
                id, quantity, prevStock, newStock, saved.getDemandVelocity());

        // Publish stock event (Trigger A check)
        eventPublisher.publishEvent(new ProductStockEvent(this, saved, prevStock, newStock, true));

        // Check Trigger B: Demand Spike (velocity > 3x category average)
        Double categoryAvg = productRepository.getAverageDemandVelocityByCategory(saved.getCategory());
        double avg = categoryAvg != null ? categoryAvg : 5.0;
        if (saved.getDemandVelocity() >= (3.0 * avg) && saved.getDemandVelocity() >= 10) {
            eventPublisher.publishEvent(new DemandSpikeEvent(this, saved, saved.getDemandVelocity(), avg));
        }

        return saved;
    }

    @Transactional
    public PricingSuggestion suggestPricing(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        Double categoryAvg = productRepository.getAverageDemandVelocityByCategory(product.getCategory());
        CategoryContext context = CategoryContext.builder()
                .category(product.getCategory())
                .categoryAvgVelocity(categoryAvg != null ? categoryAvg : 5.0)
                .totalProductsInCategory(productRepository.findByCategory(product.getCategory()).size())
                .build();

        PricingRecommendation rec = strategyRegistry.getActiveAdvisor()
                .evaluatePricing(product, TriggerReason.MANUAL, context);

        PricingSuggestion suggestion = PricingSuggestion.builder()
                .product(product)
                .currentPrice(product.getCurrentPrice())
                .recommendedPrice(rec.getRecommendedPrice())
                .changeDirection(rec.getChangeDirection())
                .confidence(rec.getConfidence())
                .reasoning(rec.getReasoning())
                .status(SuggestionStatus.PENDING)
                .triggerReason(TriggerReason.MANUAL)
                .createdAt(LocalDateTime.now())
                .build();

        if (product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.PRICE_REVIEW_PENDING);
            productRepository.save(product);
        }

        return pricingRepo.save(suggestion);
    }

    @Transactional
    public ReorderSuggestion suggestReorder(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        Double categoryAvg = productRepository.getAverageDemandVelocityByCategory(product.getCategory());
        CategoryContext context = CategoryContext.builder()
                .category(product.getCategory())
                .categoryAvgVelocity(categoryAvg != null ? categoryAvg : 5.0)
                .totalProductsInCategory(productRepository.findByCategory(product.getCategory()).size())
                .build();

        ReorderRecommendation rec = strategyRegistry.getActiveAdvisor()
                .evaluateReorder(product, TriggerReason.MANUAL, context);

        ReorderSuggestion suggestion = ReorderSuggestion.builder()
                .product(product)
                .currentStock(product.getStockLevel())
                .recommendedQuantity(rec.getRecommendedQuantity())
                .suggestedLeadTimeDays(rec.getSuggestedLeadTimeDays())
                .confidence(rec.getConfidence())
                .reasoning(rec.getReasoning())
                .status(SuggestionStatus.PENDING)
                .triggerReason(TriggerReason.MANUAL)
                .createdAt(LocalDateTime.now())
                .build();

        return reorderRepo.save(suggestion);
    }
}


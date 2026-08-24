package com.stockpulse.service;

import com.stockpulse.model.PricingSuggestion;
import com.stockpulse.model.Product;
import com.stockpulse.model.ProductStatus;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PricingSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(PricingSuggestionService.class);

    private final PricingSuggestionRepository pricingRepo;
    private final ProductRepository productRepo;

    @Autowired
    public PricingSuggestionService(PricingSuggestionRepository pricingRepo, ProductRepository productRepo) {
        this.pricingRepo = pricingRepo;
        this.productRepo = productRepo;
    }

    public List<PricingSuggestion> getAllSuggestions(SuggestionStatus status) {
        if (status != null) {
            return pricingRepo.findByStatusOrderByCreatedAtDesc(status);
        }
        return pricingRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<PricingSuggestion> getSuggestionsByProduct(String productId) {
        return pricingRepo.findByProductId(productId);
    }

    @Transactional
    public PricingSuggestion decideSuggestion(Long id, SuggestionStatus decision) {
        PricingSuggestion suggestion = pricingRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pricing suggestion not found with id: " + id));

        if (suggestion.getStatus() != SuggestionStatus.PENDING) {
            throw new IllegalStateException("Suggestion #" + id + " has already been decided: " + suggestion.getStatus());
        }

        suggestion.setStatus(decision);
        suggestion.setDecidedAt(LocalDateTime.now());

        Product product = suggestion.getProduct();

        if (decision == SuggestionStatus.ACCEPTED) {
            double oldPrice = product.getCurrentPrice();
            product.setCurrentPrice(suggestion.getRecommendedPrice());

            // Transition product lifecycle back to ACTIVE if in review and stock > 0
            if (product.getStatus() == ProductStatus.PRICE_REVIEW_PENDING && product.getStockLevel() > 0) {
                product.setStatus(ProductStatus.ACTIVE);
            }

            productRepo.save(product);
            log.info("Pricing suggestion #{} ACCEPTED for product {}. Price changed from ${} to ${}",
                    id, product.getId(), oldPrice, suggestion.getRecommendedPrice());
        } else {
            // If rejected, check if there are other pending pricing suggestions
            List<PricingSuggestion> pending = pricingRepo.findByProductIdAndStatus(product.getId(), SuggestionStatus.PENDING);
            if (pending.isEmpty() || (pending.size() == 1 && pending.get(0).getId().equals(id))) {
                if (product.getStatus() == ProductStatus.PRICE_REVIEW_PENDING && product.getStockLevel() > 0) {
                    product.setStatus(ProductStatus.ACTIVE);
                    productRepo.save(product);
                }
            }
            log.info("Pricing suggestion #{} REJECTED for product {}", id, product.getId());
        }

        return pricingRepo.save(suggestion);
    }
}


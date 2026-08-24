package com.stockpulse.service;

import com.stockpulse.model.Product;
import com.stockpulse.model.ProductStatus;
import com.stockpulse.model.ReorderSuggestion;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReorderSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(ReorderSuggestionService.class);

    private final ReorderSuggestionRepository reorderRepo;
    private final ProductRepository productRepo;

    @Autowired
    public ReorderSuggestionService(ReorderSuggestionRepository reorderRepo, ProductRepository productRepo) {
        this.reorderRepo = reorderRepo;
        this.productRepo = productRepo;
    }

    public List<ReorderSuggestion> getAllSuggestions(SuggestionStatus status) {
        if (status != null) {
            return reorderRepo.findByStatusOrderByCreatedAtDesc(status);
        }
        return reorderRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<ReorderSuggestion> getSuggestionsByProduct(String productId) {
        return reorderRepo.findByProductId(productId);
    }

    @Transactional
    public ReorderSuggestion decideSuggestion(Long id, SuggestionStatus decision) {
        ReorderSuggestion suggestion = reorderRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reorder suggestion not found with id: " + id));

        if (suggestion.getStatus() != SuggestionStatus.PENDING) {
            throw new IllegalStateException("Suggestion #" + id + " has already been decided: " + suggestion.getStatus());
        }

        suggestion.setStatus(decision);
        suggestion.setDecidedAt(LocalDateTime.now());

        Product product = suggestion.getProduct();

        if (decision == SuggestionStatus.ACCEPTED) {
            int oldStock = product.getStockLevel();
            int newStock = oldStock + suggestion.getRecommendedQuantity();
            product.setStockLevel(newStock);

            // If stock restored above 0 and above threshold, activate product
            if (newStock > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
                product.setStatus(ProductStatus.ACTIVE);
            }

            productRepo.save(product);
            log.info("Reorder suggestion #{} ACCEPTED for product {}. Simulated inbound shipment arrived: stock {} -> {}",
                    id, product.getId(), oldStock, newStock);
        } else {
            log.info("Reorder suggestion #{} REJECTED for product {}", id, product.getId());
        }

        return reorderRepo.save(suggestion);
    }
}


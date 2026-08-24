package com.stockpulse.controller;

import com.stockpulse.model.Category;
import com.stockpulse.model.Product;
import com.stockpulse.model.ProductStatus;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class AnalyticsController {

    private final ProductRepository productRepo;
    private final PricingSuggestionRepository pricingRepo;
    private final ReorderSuggestionRepository reorderRepo;

    @Autowired
    public AnalyticsController(ProductRepository productRepo,
                               PricingSuggestionRepository pricingRepo,
                               ReorderSuggestionRepository reorderRepo) {
        this.productRepo = productRepo;
        this.pricingRepo = pricingRepo;
        this.reorderRepo = reorderRepo;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        List<Product> products = productRepo.findAll();
        long pendingPricingCount = pricingRepo.findByStatus(SuggestionStatus.PENDING).size();
        long pendingReorderCount = reorderRepo.findByStatus(SuggestionStatus.PENDING).size();

        long lowStockCount = products.stream()
                .filter(p -> p.getStockLevel() <= p.getReorderThreshold())
                .count();

        long outOfStockCount = products.stream()
                .filter(p -> p.getStockLevel() == 0)
                .count();

        long pendingReviewCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.PRICE_REVIEW_PENDING)
                .count();

        Map<String, Double> categoryAverages = new HashMap<>();
        for (Category cat : Category.values()) {
            Double avg = productRepo.getAverageDemandVelocityByCategory(cat);
            categoryAverages.put(cat.name(), avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalProducts", products.size());
        metrics.put("lowStockCount", lowStockCount);
        metrics.put("outOfStockCount", outOfStockCount);
        metrics.put("pendingReviewCount", pendingReviewCount);
        metrics.put("pendingPricingSuggestions", pendingPricingCount);
        metrics.put("pendingReorderSuggestions", pendingReorderCount);
        metrics.put("categoryAverages", categoryAverages);

        return ResponseEntity.ok(metrics);
    }
}


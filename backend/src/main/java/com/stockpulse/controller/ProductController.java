package com.stockpulse.controller;

import com.stockpulse.ai.AiStreamService;
import com.stockpulse.engine.CategoryContext;
import com.stockpulse.model.*;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class ProductController {

    private final ProductService productService;
    private final ProductRepository productRepo;
    private final AiStreamService streamService;

    @Autowired
    public ProductController(ProductService productService,
                             ProductRepository productRepo,
                             AiStreamService streamService) {
        this.productService = productService;
        this.productRepo = productRepo;
        this.streamService = streamService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productService.getAllProducts(status, category, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(
            @PathVariable String id,
            @RequestBody Map<String, Integer> payload) {
        Integer newStock = payload.get("stockLevel");
        if (newStock == null) {
            newStock = payload.get("stock");
        }
        if (newStock == null || newStock < 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(productService.updateStock(id, newStock));
    }

    @PostMapping("/{id}/orders")
    public ResponseEntity<Product> recordOrder(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Integer> payload) {
        int quantity = 1;
        if (payload != null && payload.containsKey("quantity")) {
            quantity = Math.max(1, payload.get("quantity"));
        }
        return ResponseEntity.ok(productService.recordOrder(id, quantity));
    }

    @PostMapping("/{id}/suggest-pricing")
    public ResponseEntity<PricingSuggestion> suggestPricing(@PathVariable String id) {
        return ResponseEntity.ok(productService.suggestPricing(id));
    }

    @PostMapping("/{id}/suggest-reorder")
    public ResponseEntity<ReorderSuggestion> suggestReorder(@PathVariable String id) {
        return ResponseEntity.ok(productService.suggestReorder(id));
    }

    @PostMapping(value = "/{id}/suggest-pricing/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPricingSuggestion(@PathVariable String id) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));

        Double categoryAvg = productRepo.getAverageDemandVelocityByCategory(product.getCategory());
        CategoryContext context = CategoryContext.builder()
                .category(product.getCategory())
                .categoryAvgVelocity(categoryAvg != null ? categoryAvg : 5.0)
                .totalProductsInCategory(productRepo.findByCategory(product.getCategory()).size())
                .build();

        return streamService.streamPricingReasoning(product, TriggerReason.MANUAL, context);
    }
}


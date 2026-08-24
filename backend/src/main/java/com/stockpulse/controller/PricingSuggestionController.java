package com.stockpulse.controller;

import com.stockpulse.model.PricingSuggestion;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.service.PricingSuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pricing-suggestions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class PricingSuggestionController {

    private final PricingSuggestionService pricingService;

    @Autowired
    public PricingSuggestionController(PricingSuggestionService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping
    public ResponseEntity<List<PricingSuggestion>> getSuggestions(
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(required = false) String productId) {
        if (productId != null && !productId.trim().isEmpty()) {
            return ResponseEntity.ok(pricingService.getSuggestionsByProduct(productId));
        }
        return ResponseEntity.ok(pricingService.getAllSuggestions(status));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PricingSuggestion> decideSuggestion(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        if (statusStr == null) {
            statusStr = payload.get("decision");
        }
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }

        SuggestionStatus decision = SuggestionStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(pricingService.decideSuggestion(id, decision));
    }
}


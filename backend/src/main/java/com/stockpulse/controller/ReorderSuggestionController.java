package com.stockpulse.controller;

import com.stockpulse.model.ReorderSuggestion;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.service.ReorderSuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reorder-suggestions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class ReorderSuggestionController {

    private final ReorderSuggestionService reorderService;

    @Autowired
    public ReorderSuggestionController(ReorderSuggestionService reorderService) {
        this.reorderService = reorderService;
    }

    @GetMapping
    public ResponseEntity<List<ReorderSuggestion>> getSuggestions(
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(required = false) String productId) {
        if (productId != null && !productId.trim().isEmpty()) {
            return ResponseEntity.ok(reorderService.getSuggestionsByProduct(productId));
        }
        return ResponseEntity.ok(reorderService.getAllSuggestions(status));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ReorderSuggestion> decideSuggestion(
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
        return ResponseEntity.ok(reorderService.decideSuggestion(id, decision));
    }
}


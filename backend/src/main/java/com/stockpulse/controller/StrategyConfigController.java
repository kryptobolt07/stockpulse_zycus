package com.stockpulse.controller;

import com.stockpulse.engine.StrategyRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config/strategy")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class StrategyConfigController {

    private final StrategyRegistry strategyRegistry;

    @Autowired
    public StrategyConfigController(StrategyRegistry strategyRegistry) {
        this.strategyRegistry = strategyRegistry;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getActiveStrategy() {
        return ResponseEntity.ok(Map.of(
                "activeMode", strategyRegistry.getActiveMode(),
                "availableStrategies", strategyRegistry.getAvailableStrategies()
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> setActiveStrategy(@RequestBody Map<String, String> payload) {
        String mode = payload.get("mode");
        strategyRegistry.setActiveMode(mode);
        return ResponseEntity.ok(Map.of(
                "activeMode", strategyRegistry.getActiveMode(),
                "message", "Strategy mode successfully updated at runtime to " + strategyRegistry.getActiveMode()
        ));
    }
}


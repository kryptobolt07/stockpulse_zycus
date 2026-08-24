package com.stockpulse.controller;

import com.stockpulse.config.DataInitializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/seed")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class SeedController {

    private final DataInitializer dataInitializer;

    @Autowired
    public SeedController(DataInitializer dataInitializer) {
        this.dataInitializer = dataInitializer;
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetDatabase() {
        dataInitializer.seedDatabase();
        return ResponseEntity.ok(Map.of("message", "Database reset and seeded with initial demo catalog."));
    }
}


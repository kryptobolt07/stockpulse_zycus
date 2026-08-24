package com.stockpulse.ai;

import com.stockpulse.engine.CategoryContext;
import com.stockpulse.engine.PricingRecommendation;
import com.stockpulse.engine.StrategyRegistry;
import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AiStreamService {

    private static final Logger log = LoggerFactory.getLogger(AiStreamService.class);
    private final StrategyRegistry strategyRegistry;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Autowired
    public AiStreamService(StrategyRegistry strategyRegistry) {
        this.strategyRegistry = strategyRegistry;
    }

    public SseEmitter streamPricingReasoning(Product product, TriggerReason trigger, CategoryContext context) {
        SseEmitter emitter = new SseEmitter(60_000L); // 60s timeout

        executor.submit(() -> {
            try {
                emitter.send(SseEmitter.event().name("status").data("Analyzing product telemetry and category benchmarks..."));
                Thread.sleep(300);

                emitter.send(SseEmitter.event().name("status").data(String.format(
                        "Evaluating stock ratio (%d units vs %d threshold) and velocity (%d orders/24h)...",
                        product.getStockLevel(), product.getReorderThreshold(), product.getDemandVelocity())));
                Thread.sleep(400);

                PricingRecommendation rec = strategyRegistry.getActiveAdvisor().evaluatePricing(product, trigger, context);

                // Stream tokens of reasoning
                String[] words = rec.getReasoning().split(" ");
                StringBuilder accumulated = new StringBuilder();
                for (String word : words) {
                    accumulated.append(word).append(" ");
                    emitter.send(SseEmitter.event().name("token").data(word + " "));
                    Thread.sleep(40);
                }

                // Send final structured recommendation
                emitter.send(SseEmitter.event().name("complete").data(rec));
                emitter.complete();
            } catch (IOException | InterruptedException e) {
                log.warn("Error during SSE streaming for product {}: {}", product.getId(), e.getMessage());
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}


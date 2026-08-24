package com.stockpulse.agent;

import com.stockpulse.model.Product;
import com.stockpulse.model.TriggerReason;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class InventoryEventListener {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventListener.class);

    private final AgenticAdvisorService advisorService;

    @Autowired
    public InventoryEventListener(AgenticAdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    @Async
    @EventListener
    public void handleStockChangedEvent(ProductStockEvent event) {
        Product product = event.getProduct();
        log.info("Async Event Received: ProductStockEvent for product {} (prev: {}, curr: {}, threshold: {})",
                product.getId(), event.getPreviousStock(), event.getCurrentStock(), product.getReorderThreshold());

        // Check Trigger A: Inventory Low (stock dropped below reorder threshold)
        if (event.getCurrentStock() < product.getReorderThreshold()) {
            advisorService.processInventorySignal(product, TriggerReason.INVENTORY_LOW);
        }
    }

    @Async
    @EventListener
    public void handleDemandSpikeEvent(DemandSpikeEvent event) {
        Product product = event.getProduct();
        log.info("Async Event Received: DemandSpikeEvent for product {} (velocity: {}, category avg: {})",
                product.getId(), event.getCurrentVelocity(), event.getCategoryAverageVelocity());

        advisorService.processInventorySignal(product, TriggerReason.DEMAND_SPIKE);
    }
}


package com.stockpulse.agent;

import com.stockpulse.model.Product;
import org.springframework.context.ApplicationEvent;

public class ProductStockEvent extends ApplicationEvent {
    private static final long serialVersionUID = 1L;

    private final Product product;
    private final int previousStock;
    private final int currentStock;
    private final boolean triggeredByOrder;

    public ProductStockEvent(Object source, Product product, int previousStock, int currentStock, boolean triggeredByOrder) {
        super(source);
        this.product = product;
        this.previousStock = previousStock;
        this.currentStock = currentStock;
        this.triggeredByOrder = triggeredByOrder;
    }

    public Product getProduct() {
        return product;
    }

    public int getPreviousStock() {
        return previousStock;
    }

    public int getCurrentStock() {
        return currentStock;
    }

    public boolean isTriggeredByOrder() {
        return triggeredByOrder;
    }
}


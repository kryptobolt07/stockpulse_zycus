package com.stockpulse.agent;

import com.stockpulse.model.Product;
import org.springframework.context.ApplicationEvent;

public class DemandSpikeEvent extends ApplicationEvent {
    private static final long serialVersionUID = 1L;

    private final Product product;
    private final int currentVelocity;
    private final double categoryAverageVelocity;

    public DemandSpikeEvent(Object source, Product product, int currentVelocity, double categoryAverageVelocity) {
        super(source);
        this.product = product;
        this.currentVelocity = currentVelocity;
        this.categoryAverageVelocity = categoryAverageVelocity;
    }

    public Product getProduct() {
        return product;
    }

    public int getCurrentVelocity() {
        return currentVelocity;
    }

    public double getCategoryAverageVelocity() {
        return categoryAverageVelocity;
    }
}


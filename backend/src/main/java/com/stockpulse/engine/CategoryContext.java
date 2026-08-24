package com.stockpulse.engine;

import com.stockpulse.model.Category;

public class CategoryContext {
    private Category category;
    private double categoryAvgVelocity;
    private int totalProductsInCategory;
    private double overallAvgVelocity;

    public CategoryContext() {}

    public CategoryContext(Category category, double categoryAvgVelocity, int totalProductsInCategory, double overallAvgVelocity) {
        this.category = category;
        this.categoryAvgVelocity = categoryAvgVelocity;
        this.totalProductsInCategory = totalProductsInCategory;
        this.overallAvgVelocity = overallAvgVelocity;
    }

    public static CategoryContextBuilder builder() {
        return new CategoryContextBuilder();
    }

    public static class CategoryContextBuilder {
        private Category category;
        private double categoryAvgVelocity;
        private int totalProductsInCategory;
        private double overallAvgVelocity;

        public CategoryContextBuilder category(Category category) { this.category = category; return this; }
        public CategoryContextBuilder categoryAvgVelocity(double categoryAvgVelocity) { this.categoryAvgVelocity = categoryAvgVelocity; return this; }
        public CategoryContextBuilder totalProductsInCategory(int totalProductsInCategory) { this.totalProductsInCategory = totalProductsInCategory; return this; }
        public CategoryContextBuilder overallAvgVelocity(double overallAvgVelocity) { this.overallAvgVelocity = overallAvgVelocity; return this; }

        public CategoryContext build() {
            return new CategoryContext(category, categoryAvgVelocity, totalProductsInCategory, overallAvgVelocity);
        }
    }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public double getCategoryAvgVelocity() { return categoryAvgVelocity; }
    public void setCategoryAvgVelocity(double categoryAvgVelocity) { this.categoryAvgVelocity = categoryAvgVelocity; }

    public int getTotalProductsInCategory() { return totalProductsInCategory; }
    public void setTotalProductsInCategory(int totalProductsInCategory) { this.totalProductsInCategory = totalProductsInCategory; }

    public double getOverallAvgVelocity() { return overallAvgVelocity; }
    public void setOverallAvgVelocity(double overallAvgVelocity) { this.overallAvgVelocity = overallAvgVelocity; }
}


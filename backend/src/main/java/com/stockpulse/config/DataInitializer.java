package com.stockpulse.config;

import com.stockpulse.model.*;
import com.stockpulse.repository.PricingSuggestionRepository;
import com.stockpulse.repository.ProductRepository;
import com.stockpulse.repository.ReorderSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ProductRepository productRepo;
    private final PricingSuggestionRepository pricingRepo;
    private final ReorderSuggestionRepository reorderRepo;

    @Autowired
    public DataInitializer(ProductRepository productRepo,
                           PricingSuggestionRepository pricingRepo,
                           ReorderSuggestionRepository reorderRepo) {
        this.productRepo = productRepo;
        this.pricingRepo = pricingRepo;
        this.reorderRepo = reorderRepo;
    }

    @Override
    public void run(String... args) {
        seedDatabase();
    }

    public void seedDatabase() {
        pricingRepo.deleteAll();
        reorderRepo.deleteAll();
        productRepo.deleteAll();

        log.info("Seeding Addendum A Products into H2 Database...");

        List<Product> products = List.of(
                Product.builder().id("PRD-001").sku("SKU-ELEC-001").name("Wireless Earbuds Pro").category(Category.ELECTRONICS).currentPrice(79.99).stockLevel(45).reorderThreshold(20).demandVelocity(3).status(ProductStatus.ACTIVE).costPrice(42.00).marginFloor(55.00).supplierId("SUPP-ELEC-01").build(),
                Product.builder().id("PRD-002").sku("SKU-ELEC-002").name("USB-C Hub 7-Port").category(Category.ELECTRONICS).currentPrice(34.99).stockLevel(120).reorderThreshold(30).demandVelocity(1).status(ProductStatus.ACTIVE).costPrice(16.50).marginFloor(22.00).supplierId("SUPP-ELEC-02").build(),
                Product.builder().id("PRD-003").sku("SKU-APP-001").name("Organic Cotton T-Shirt").category(Category.APPAREL).currentPrice(24.99).stockLevel(8).reorderThreshold(15).demandVelocity(12).status(ProductStatus.PRICE_REVIEW_PENDING).costPrice(9.00).marginFloor(14.00).supplierId("SUPP-APP-01").build(),
                Product.builder().id("PRD-004").sku("SKU-APP-002").name("Running Shorts — Navy").category(Category.APPAREL).currentPrice(39.99).stockLevel(55).reorderThreshold(20).demandVelocity(2).status(ProductStatus.ACTIVE).costPrice(18.00).marginFloor(25.00).supplierId("SUPP-APP-01").build(),
                Product.builder().id("PRD-005").sku("SKU-HOME-001").name("Ceramic Pour-Over Set").category(Category.HOME).currentPrice(49.99).stockLevel(22).reorderThreshold(10).demandVelocity(4).status(ProductStatus.ACTIVE).costPrice(21.00).marginFloor(30.00).supplierId("SUPP-HOME-01").build(),
                Product.builder().id("PRD-006").sku("SKU-HOME-002").name("LED Desk Lamp — Dimmable").category(Category.HOME).currentPrice(59.99).stockLevel(0).reorderThreshold(15).demandVelocity(0).status(ProductStatus.OUT_OF_STOCK).costPrice(28.00).marginFloor(38.00).supplierId("SUPP-HOME-02").build(),
                Product.builder().id("PRD-007").sku("SKU-ELEC-003").name("Portable Charger 20K").category(Category.ELECTRONICS).currentPrice(44.99).stockLevel(18).reorderThreshold(25).demandVelocity(8).status(ProductStatus.ACTIVE).costPrice(20.00).marginFloor(28.00).supplierId("SUPP-ELEC-01").build(),
                Product.builder().id("PRD-008").sku("SKU-APP-003").name("Hoodie — Heather Grey").category(Category.APPAREL).currentPrice(54.99).stockLevel(11).reorderThreshold(12).demandVelocity(15).status(ProductStatus.ACTIVE).costPrice(24.00).marginFloor(35.00).supplierId("SUPP-APP-02").build()
        );

        productRepo.saveAll(products);

        // Seed initial pending suggestions for PRD-003 (as specified in brief: PRD-003 has stock 8 < threshold 15)
        Product prd3 = productRepo.findById("PRD-003").orElse(null);
        if (prd3 != null) {
            pricingRepo.save(PricingSuggestion.builder()
                    .product(prd3)
                    .currentPrice(24.99)
                    .recommendedPrice(27.99)
                    .changeDirection(ChangeDirection.INCREASE)
                    .confidence(0.88)
                    .reasoning("Trigger [INVENTORY_LOW]: Stock level is 8 units against threshold 15 with rapid demand velocity (12/24h). Recommended a +12% defensive price hike to preserve remaining units before stockout.")
                    .status(SuggestionStatus.PENDING)
                    .triggerReason(TriggerReason.INVENTORY_LOW)
                    .createdAt(LocalDateTime.now())
                    .build());

            reorderRepo.save(ReorderSuggestion.builder()
                    .product(prd3)
                    .currentStock(8)
                    .recommendedQuantity(37)
                    .suggestedLeadTimeDays(7)
                    .confidence(0.90)
                    .reasoning("Trigger [INVENTORY_LOW]: Burn-rate projection indicates stockout within 16 hours. Recommending priority replenishment batch of 37 units (safety stock buffer).")
                    .status(SuggestionStatus.PENDING)
                    .triggerReason(TriggerReason.INVENTORY_LOW)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        log.info("Catalog successfully seeded with 8 products and initial demo triggers.");
    }
}


package com.stockpulse.repository;

import com.stockpulse.model.Category;
import com.stockpulse.model.Product;
import com.stockpulse.model.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    List<Product> findByStatus(ProductStatus status);

    List<Product> findByCategory(Category category);

    List<Product> findByStatusAndCategory(ProductStatus status, Category category);

    @Query("SELECT AVG(p.demandVelocity) FROM Product p WHERE p.category = :category")
    Double getAverageDemandVelocityByCategory(@Param("category") Category category);

    @Query("SELECT AVG(p.demandVelocity) FROM Product p")
    Double getOverallAverageDemandVelocity();

    List<Product> findByStockLevelLessThan(Integer threshold);
}


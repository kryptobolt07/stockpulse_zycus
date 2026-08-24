package com.stockpulse.repository;

import com.stockpulse.model.PricingSuggestion;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.model.TriggerReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricingSuggestionRepository extends JpaRepository<PricingSuggestion, Long> {

    List<PricingSuggestion> findByStatus(SuggestionStatus status);

    List<PricingSuggestion> findByProductId(String productId);

    List<PricingSuggestion> findByProductIdAndStatus(String productId, SuggestionStatus status);

    boolean existsByProductIdAndTriggerReasonAndStatus(String productId, TriggerReason triggerReason, SuggestionStatus status);

    List<PricingSuggestion> findAllByOrderByCreatedAtDesc();

    List<PricingSuggestion> findByStatusOrderByCreatedAtDesc(SuggestionStatus status);
}


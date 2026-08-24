package com.stockpulse.repository;

import com.stockpulse.model.ReorderSuggestion;
import com.stockpulse.model.SuggestionStatus;
import com.stockpulse.model.TriggerReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReorderSuggestionRepository extends JpaRepository<ReorderSuggestion, Long> {

    List<ReorderSuggestion> findByStatus(SuggestionStatus status);

    List<ReorderSuggestion> findByProductId(String productId);

    List<ReorderSuggestion> findByProductIdAndStatus(String productId, SuggestionStatus status);

    boolean existsByProductIdAndTriggerReasonAndStatus(String productId, TriggerReason triggerReason, SuggestionStatus status);

    List<ReorderSuggestion> findAllByOrderByCreatedAtDesc();

    List<ReorderSuggestion> findByStatusOrderByCreatedAtDesc(SuggestionStatus status);
}


package com.stockpulse.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ActivityStreamService {

    private static final Logger log = LoggerFactory.getLogger(ActivityStreamService.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout

        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Connected to StockPulse Real-Time Event Stream")));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastEvent(String eventName, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    public void emitEvaluationStart(String productId, String productName, String triggerReason) {
        log.info("SSE Broadcast: LLM_EVALUATION_START for {} [{}] ({})", productId, productName, triggerReason);
        broadcastEvent("LLM_EVALUATION_START", Map.of(
                "productId", productId,
                "productName", productName,
                "triggerReason", triggerReason,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void emitEvaluationComplete(String productId, String productName, String triggerReason) {
        log.info("SSE Broadcast: LLM_EVALUATION_COMPLETE for {} [{}]", productId, productName);
        broadcastEvent("LLM_EVALUATION_COMPLETE", Map.of(
                "productId", productId,
                "productName", productName,
                "triggerReason", triggerReason,
                "timestamp", System.currentTimeMillis()
        ));
    }
}


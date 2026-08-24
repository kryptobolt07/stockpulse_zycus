package com.stockpulse.controller;

import com.stockpulse.ai.ActivityStreamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4200", "http://127.0.0.1:5173", "*"})
public class ActivityEventController {

    private final ActivityStreamService activityStreamService;

    @Autowired
    public ActivityEventController(ActivityStreamService activityStreamService) {
        this.activityStreamService = activityStreamService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamActivity() {
        return activityStreamService.createEmitter();
    }
}


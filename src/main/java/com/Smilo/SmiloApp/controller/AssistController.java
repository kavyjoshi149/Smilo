package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.payload.AssistRequest;
import com.Smilo.SmiloApp.services.AssistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat/assist")
@RequiredArgsConstructor
public class AssistController {

    private final AssistService assistService;

    @PostMapping
    public ResponseEntity<Map<String, String>> reply(@Valid @RequestBody AssistRequest request) {
        String reply = assistService.getReply(request.getMessage());
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
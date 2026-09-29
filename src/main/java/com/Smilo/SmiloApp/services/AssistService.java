package com.Smilo.SmiloApp.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistService {

    private final RestTemplate restTemplate;

    @Value("${spring.ai.google.genai.api-key}")
    private String apiKey;

    @Value("${spring.ai.google.genai.chat.model}")
    private String model;

    private static final String SYSTEM_PROMPT =
            "You are SMILO Assist, a warm, encouraging companion inside a positivity/gratitude app called SMILO. " +
                    "Keep replies short (2-4 sentences), supportive, and conversational — never clinical. " +
                    "You can help users express difficult feelings privately, turn a moment into a thought they could " +
                    "choose to share, or suggest a simple positive action. Never claim to post anything automatically.";

    public String getReply(String userMessage) {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey
        );

        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                ),
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
                )
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "I'm having trouble responding right now — try again in a moment.";
        }
    }
}
package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.repository.ThoughtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ThoughtCleanupJob {

    private final ThoughtRepository thoughtRepository;

    // Runs every hour
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void deleteExpiredThoughts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        thoughtRepository.deleteExpiredThoughts(cutoff);
        System.out.println("Cleaned up thoughts older than: " + cutoff);
    }
}
package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.entity.ThoughtReaction;
import com.Smilo.SmiloApp.payload.ThoughtRequest;
import com.Smilo.SmiloApp.payload.ThoughtResponse;
import com.Smilo.SmiloApp.services.ThoughtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thought")
@RequiredArgsConstructor
public class ThoughtController {

    private final ThoughtService thoughtService;

    @PostMapping
    public ResponseEntity<ThoughtResponse> create(Authentication auth, @Valid @RequestBody ThoughtRequest request) {
        return ResponseEntity.ok(thoughtService.createThought(auth.getName(), request));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<ThoughtResponse>> feed(Authentication auth, @RequestParam(defaultValue = "global") String tab) {
        return ResponseEntity.ok(thoughtService.getFeed(auth.getName(), tab));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ThoughtResponse>> mine(Authentication auth, @RequestParam(defaultValue = "all") String visibility) {
        return ResponseEntity.ok(thoughtService.getMyThoughts(auth.getName(), visibility));
    }

    @DeleteMapping("/{thoughtId}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String thoughtId) {
        thoughtService.deleteThought(auth.getName(), thoughtId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{thoughtId}/react/{type}")
    public ResponseEntity<ThoughtResponse> react(Authentication auth, @PathVariable String thoughtId, @PathVariable ThoughtReaction.ReactionType type) {
        return ResponseEntity.ok(thoughtService.toggleReaction(auth.getName(), thoughtId, type));
    }

    @PostMapping("/{thoughtId}/share")
    public ResponseEntity<ThoughtResponse> share(@PathVariable String thoughtId) {
        return ResponseEntity.ok(thoughtService.incrementShare(thoughtId));
    }
}
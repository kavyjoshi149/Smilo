package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.payload.*;
import com.Smilo.SmiloApp.services.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("/discover")
    public ResponseEntity<List<PersonResponse>> discover(Authentication auth, @RequestParam(required = false) String query) {
        return ResponseEntity.ok(friendService.discover(auth.getName(), query));
    }

    @GetMapping
    public ResponseEntity<List<PersonResponse>> myFriends(Authentication auth) {
        return ResponseEntity.ok(friendService.myFriends(auth.getName()));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestResponse>> received(Authentication auth) {
        return ResponseEntity.ok(friendService.pendingReceived(auth.getName()));
    }

    @GetMapping("/sent")
    public ResponseEntity<List<FriendRequestResponse>> sent(Authentication auth) {
        return ResponseEntity.ok(friendService.pendingSent(auth.getName()));
    }

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<Void> sendRequest(Authentication auth, @PathVariable String receiverId) {
        friendService.sendRequest(auth.getName(), receiverId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request/{requestId}/accept")
    public ResponseEntity<Void> accept(Authentication auth, @PathVariable String requestId) {
        friendService.respond(auth.getName(), requestId, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request/{requestId}/decline")
    public ResponseEntity<Void> decline(Authentication auth, @PathVariable String requestId) {
        friendService.respond(auth.getName(), requestId, false);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{otherUserId}")
    public ResponseEntity<Void> remove(Authentication auth, @PathVariable String otherUserId) {
        friendService.removeFriend(auth.getName(), otherUserId);
        return ResponseEntity.noContent().build();
    }
}

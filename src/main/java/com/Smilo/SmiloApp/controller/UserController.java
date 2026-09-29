package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.payload.UserResponse;
import com.Smilo.SmiloApp.services.SmileDetectionService;
import com.Smilo.SmiloApp.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SmileDetectionService smileDetectionService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String userName = authentication.getName();
        UserResponse response = userService.getUserByUserName(userName);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/smile-photo", consumes = "multipart/form-data")
    public ResponseEntity<UserResponse> submitSmilePhoto(
            Authentication authentication,
            @RequestParam("photo") MultipartFile photo
    ) throws IOException {

        if (photo.isEmpty()) {
            throw new IllegalArgumentException("Photo is required");
        }

        byte[] imageBytes = photo.getBytes(); // held only in memory, never saved to disk

        int smilingFaceCount = smileDetectionService.countSmilingFaces(imageBytes);

        UserResponse response = userService.addSmilePoints(authentication.getName(), smilingFaceCount);
        return ResponseEntity.ok(response);
    }
}
package com.Smilo.SmiloApp.controller;

import com.Smilo.SmiloApp.payload.*;
import com.Smilo.SmiloApp.entity.User;
import com.Smilo.SmiloApp.repository.UserRepository;
import com.Smilo.SmiloApp.security.JwtService;
import com.Smilo.SmiloApp.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        UserResponse userResponse = userService.registerUser(request);
        String token = jwtService.generateToken(userResponse.getUserName());
        return ResponseEntity.ok(new AuthResponse(token, userResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String identifier = request.getUserName(); // may actually contain an email

        String resolvedUsername = identifier.contains("@")
                ? userRepository.findByEmail(identifier).map(User::getUserName).orElse(identifier)
                : identifier;

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(resolvedUsername, request.getPassword())
        );

        UserResponse userResponse = userService.getUserByUserName(resolvedUsername);
        String token = jwtService.generateToken(resolvedUsername);

        return ResponseEntity.ok(new AuthResponse(token, userResponse));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("If this email is registered, a reset code has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok("Password reset successful. You can now log in with your new password.");
    }
}
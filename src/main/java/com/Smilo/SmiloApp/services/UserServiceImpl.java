package com.Smilo.SmiloApp.services;


import com.Smilo.SmiloApp.entity.PasswordResetOtp;
import com.Smilo.SmiloApp.entity.User;
import com.Smilo.SmiloApp.exceptions.ResourceNotFoundException;
import com.Smilo.SmiloApp.payload.ResetPasswordRequest;
import com.Smilo.SmiloApp.payload.UserRegisterRequest;
import com.Smilo.SmiloApp.payload.UserResponse;
import com.Smilo.SmiloApp.repository.PasswordResetOtpRepository;
import com.Smilo.SmiloApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetOtpRepository otpRepository;
    private final EmailService emailService;


    @Override
    public UserResponse addSmilePoints(String userName, int count) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userName));

        LocalDate today = LocalDate.now();
        LocalDate lastIncrease = user.getLastIncrease();

        if (lastIncrease == null) {
            user.setStreak(1);
        } else {
            long daysBetween = ChronoUnit.DAYS.between(lastIncrease, today);
            if (daysBetween == 1) {
                user.setStreak(user.getStreak() + 1);
            } else if (daysBetween > 1) {
                user.setStreak(1);
            }
        }

        user.setSmilePoint(user.getSmilePoint() + count);
        user.setLastIncrease(today);

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        PasswordResetOtp resetOtp = new PasswordResetOtp();
        resetOtp.setEmail(email);
        resetOtp.setOtp(otp);
        resetOtp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetOtp.setUsed(false);
        otpRepository.save(resetOtp);

        emailService.sendOtpEmail(email, otp);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetOtp resetOtp = otpRepository
                .findTopByEmailAndUsedFalseOrderByExpiresAtDesc(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No reset request found for this email"));

        if (resetOtp.isUsed() || resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired or already been used");
        }

        if (!resetOtp.getOtp().equals(request.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetOtp.setUsed(true);
        otpRepository.save(resetOtp);
    }
    @Override
    public UserResponse registerUser(UserRegisterRequest request) {
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setUserName(request.getUserName());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setSmilePoint(0);
        user.setStreak(0);
        user.setBio("New to SmiloApp — here to share something worth smiling about.");
        user.setAvatarUrl(generateAvatarUrl(request.getUserName()));

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return toResponse(user);
    }

    @Override
    public UserResponse getUserByUserName(String userName) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userName));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(), user.getUserName(), user.getName(), user.getEmail(),
                user.getAvatarUrl(), user.getBio(), user.getSmilePoint(), user.getStreak()
        );
    }

    private String generateAvatarUrl(String seed) {
        String encoded = URLEncoder.encode(seed, StandardCharsets.UTF_8);
        return "https://api.dicebear.com/7.x/notionists/svg?seed=" + encoded;
    }

}
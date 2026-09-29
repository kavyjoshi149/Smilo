package com.Smilo.SmiloApp.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("SmiloApp — Password Reset Code");
        message.setText("Your password reset code is: " + otp + "\n\nThis code expires in 10 minutes. If you didn't request this, ignore this email.");
        mailSender.send(message);
    }
}
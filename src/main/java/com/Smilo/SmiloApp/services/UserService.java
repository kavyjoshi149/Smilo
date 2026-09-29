package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.payload.ResetPasswordRequest;
import com.Smilo.SmiloApp.payload.UserRegisterRequest;
import com.Smilo.SmiloApp.payload.UserResponse;

public interface UserService {
    UserResponse registerUser(UserRegisterRequest request);
    UserResponse getUserById(String userId);
    UserResponse getUserByUserName(String userName);
    UserResponse addSmilePoints(String userName, int count);
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
}
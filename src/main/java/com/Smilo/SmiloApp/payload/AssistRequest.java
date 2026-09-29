package com.Smilo.SmiloApp.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssistRequest {
    @NotBlank
    private String message;
}
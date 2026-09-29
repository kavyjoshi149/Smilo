package com.Smilo.SmiloApp.payload;

import com.Smilo.SmiloApp.entity.Thought;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data

public class ThoughtRequest {
    @NotBlank @Size(max = 500)
    private String content;

    @NotNull
    private Thought.Visibility visibility;
}
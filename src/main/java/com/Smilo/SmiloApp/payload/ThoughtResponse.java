package com.Smilo.SmiloApp.payload;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class ThoughtResponse {
    private String thoughtId;
    private String content;
    private String visibility;      // "GLOBAL" / "FRIENDS" / "ONLY_ME"
    private LocalDateTime createdAt;
    private int shares;
    private int commentCount;       // always 0 for now — frontend doesn't implement comments yet
    private Map<String, Integer> reactions;     // {"SMILE": 4, "INSPIRED": 1, ...}
    private List<String> myReactions;           // types the current viewer has reacted with
    private String authorId;
    private String authorUserName;
    private String authorName;
    private String authorAvatarUrl;
    private boolean mine;
}
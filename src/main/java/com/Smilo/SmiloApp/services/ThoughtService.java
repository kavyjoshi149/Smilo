package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.entity.ThoughtReaction;
import com.Smilo.SmiloApp.payload.ThoughtRequest;
import com.Smilo.SmiloApp.payload.ThoughtResponse;

import java.util.List;
public interface ThoughtService {
    ThoughtResponse createThought(String userName, ThoughtRequest request);
    List<ThoughtResponse> getFeed(String userName, String tab); // "global" | "friends"
    List<ThoughtResponse> getMyThoughts(String userName, String visibilityFilter); // "all" | "global" | "friends" | "only_me"
    void deleteThought(String userName, String thoughtId);
    ThoughtResponse toggleReaction(String userName, String thoughtId, ThoughtReaction.ReactionType type);
    ThoughtResponse incrementShare(String thoughtId);
}
package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.entity.*;
import com.Smilo.SmiloApp.exceptions.ResourceNotFoundException;
import com.Smilo.SmiloApp.payload.ThoughtRequest;
import com.Smilo.SmiloApp.payload.ThoughtResponse;
import com.Smilo.SmiloApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThoughtServiceImpl implements ThoughtService {

    private final ThoughtRepository thoughtRepository;
    private final ThoughtReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository; // NEW

    // NEW — replaces the old user.getFriends() call, since User no longer
    // has a direct friends list. Friendship is derived from accepted requests.
    private List<String> friendIdsOf(String userId) {
        return friendRequestRepository.findAcceptedForUser(userId).stream()
                .map(r -> r.getSender().getUserId().equals(userId)
                        ? r.getReceiver().getUserId()
                        : r.getSender().getUserId())
                .collect(Collectors.toList());
    }

    @Override
    public ThoughtResponse createThought(String userName, ThoughtRequest request) {
        User user = getUser(userName);

        Thought thought = new Thought();
        thought.setContent(request.getContent());
        thought.setVisibility(request.getVisibility());
        thought.setUser(user);

        Thought saved = thoughtRepository.save(thought);
        return toResponse(saved, user);
    }

    @Override
    @Transactional
    public List<ThoughtResponse> getFeed(String userName, String tab) {
        User user = getUser(userName);
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<Thought> thoughts;
        if ("friends".equalsIgnoreCase(tab)) {
            List<String> friendIds = friendIdsOf(user.getUserId()); // CHANGED
            thoughts = friendIds.isEmpty() ? List.of() : thoughtRepository.findFriendsFeed(friendIds, cutoff);
        } else {
            thoughts = thoughtRepository.findGlobalFeed(user.getUserId(), cutoff);
        }

        return thoughts.stream().map(t -> toResponse(t, user)).collect(Collectors.toList());
    }

    @Override
    public List<ThoughtResponse> getMyThoughts(String userName, String visibilityFilter) {
        User user = getUser(userName);
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<Thought> thoughts = thoughtRepository
                .findByUser_UserIdAndCreatedAtAfterOrderByCreatedAtDesc(user.getUserId(), cutoff);

        if (visibilityFilter != null && !"all".equalsIgnoreCase(visibilityFilter)) {
            Thought.Visibility target = Thought.Visibility.valueOf(visibilityFilter.toUpperCase());
            thoughts = thoughts.stream().filter(t -> t.getVisibility() == target).collect(Collectors.toList());
        }

        return thoughts.stream().map(t -> toResponse(t, user)).collect(Collectors.toList());
    }

    @Override
    public void deleteThought(String userName, String thoughtId) {
        Thought thought = thoughtRepository.findById(thoughtId)
                .orElseThrow(() -> new ResourceNotFoundException("Thought not found: " + thoughtId));

        if (!thought.getUser().getUserName().equals(userName)) {
            throw new AccessDeniedException("You can only delete your own thoughts");
        }
        thoughtRepository.delete(thought);
    }

    @Override
    @Transactional
    public ThoughtResponse toggleReaction(String userName, String thoughtId, ThoughtReaction.ReactionType type) {
        User user = getUser(userName);
        Thought thought = thoughtRepository.findById(thoughtId)
                .orElseThrow(() -> new ResourceNotFoundException("Thought not found: " + thoughtId));

        Optional<ThoughtReaction> existing = reactionRepository
                .findByThought_ThoughtIdAndUser_UserIdAndType(thoughtId, user.getUserId(), type);

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            ThoughtReaction reaction = new ThoughtReaction();
            reaction.setThought(thought);
            reaction.setUser(user);
            reaction.setType(type);
            reactionRepository.save(reaction);
        }

        return toResponse(thought, user);
    }

    @Override
    public ThoughtResponse incrementShare(String thoughtId) {
        Thought thought = thoughtRepository.findById(thoughtId)
                .orElseThrow(() -> new ResourceNotFoundException("Thought not found: " + thoughtId));
        thought.setShares(thought.getShares() + 1);
        Thought saved = thoughtRepository.save(thought);
        return toResponse(saved, saved.getUser());
    }

    private User getUser(String userName) {
        return userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userName));
    }

    private ThoughtResponse toResponse(Thought t, User viewer) {
        List<ThoughtReaction> allReactions = reactionRepository.findByThought_ThoughtId(t.getThoughtId());

        Map<String, Integer> counts = new HashMap<>();
        for (ThoughtReaction.ReactionType type : ThoughtReaction.ReactionType.values()) {
            counts.put(type.name(), 0);
        }
        for (ThoughtReaction r : allReactions) {
            counts.merge(r.getType().name(), 1, Integer::sum);
        }

        List<String> myReactions = allReactions.stream()
                .filter(r -> r.getUser().getUserId().equals(viewer.getUserId()))
                .map(r -> r.getType().name())
                .collect(Collectors.toList());

        User author = t.getUser();

        return new ThoughtResponse(
                t.getThoughtId(), t.getContent(), t.getVisibility().name(), t.getCreatedAt(),
                t.getShares(), 0, counts, myReactions,
                author.getUserId(), author.getUserName(), author.getName(), author.getAvatarUrl(),
                author.getUserId().equals(viewer.getUserId())
        );
    }
}
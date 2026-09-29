package com.Smilo.SmiloApp.services;

import com.Smilo.SmiloApp.entity.*;
import com.Smilo.SmiloApp.exceptions.ResourceNotFoundException;
import com.Smilo.SmiloApp.payload.*;
import com.Smilo.SmiloApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestRepository requestRepository;
    private final UserRepository userRepository;

    private User getUser(String userName) {
        return userRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userName));
    }

    private List<String> friendIdsOf(String userId) {
        return requestRepository.findAcceptedForUser(userId).stream()
                .map(r -> r.getSender().getUserId().equals(userId) ? r.getReceiver().getUserId() : r.getSender().getUserId())
                .collect(Collectors.toList());
    }

    public List<PersonResponse> discover(String userName, String query) {
        User me = getUser(userName);
        Set<String> friendIds = new HashSet<>(friendIdsOf(me.getUserId()));

        List<User> candidates = userRepository.findAll().stream()
                .filter(u -> !u.getUserId().equals(me.getUserId()) && !friendIds.contains(u.getUserId()))
                .collect(Collectors.toList());

        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase();
            candidates = candidates.stream()
                    .filter(u -> u.getName().toLowerCase().contains(q) || u.getUserName().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        return candidates.stream().map(u -> toPersonResponse(u, me, friendIds)).collect(Collectors.toList());
    }

    public List<PersonResponse> myFriends(String userName) {
        User me = getUser(userName);
        List<String> friendIds = friendIdsOf(me.getUserId());
        return friendIds.stream()
                .map(id -> userRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(u -> toPersonResponse(u, me, new HashSet<>(friendIds)))
                .collect(Collectors.toList());
    }

    public List<FriendRequestResponse> pendingReceived(String userName) {
        User me = getUser(userName);
        return requestRepository.findByReceiver_UserIdAndStatus(me.getUserId(), FriendRequest.Status.PENDING)
                .stream().map(r -> new FriendRequestResponse(r.getRequestId(), r.getSender().getUserId(), r.getSender().getUserName(), r.getSender().getName(), r.getSender().getAvatarUrl(), r.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<FriendRequestResponse> pendingSent(String userName) {
        User me = getUser(userName);
        return requestRepository.findBySender_UserIdAndStatus(me.getUserId(), FriendRequest.Status.PENDING)
                .stream().map(r -> new FriendRequestResponse(r.getRequestId(), r.getReceiver().getUserId(), r.getReceiver().getUserName(), r.getReceiver().getName(), r.getReceiver().getAvatarUrl(), r.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public void sendRequest(String userName, String receiverId) {
        User sender = getUser(userName);
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + receiverId));

        if (sender.getUserId().equals(receiverId)) {
            throw new IllegalArgumentException("You cannot add yourself as a friend");
        }
        if (requestRepository.findActiveBetween(sender.getUserId(), receiverId).isPresent()) {
            throw new IllegalArgumentException("A request already exists between you and this user");
        }

        FriendRequest request = new FriendRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        requestRepository.save(request);
    }

    public void respond(String userName, String requestId, boolean accept) {
        User me = getUser(userName);
        FriendRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + requestId));

        if (!request.getReceiver().getUserId().equals(me.getUserId())) {
            throw new AccessDeniedException("This request wasn't sent to you");
        }

        request.setStatus(accept ? FriendRequest.Status.ACCEPTED : FriendRequest.Status.DECLINED);
        requestRepository.save(request);
    }

    public void removeFriend(String userName, String otherUserId) {
        User me = getUser(userName);
        FriendRequest request = requestRepository.findActiveBetween(me.getUserId(), otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("You're not friends with this user"));
        requestRepository.delete(request);
    }

    private PersonResponse toPersonResponse(User u, User me, Set<String> myFriendIds) {
        List<String> theirFriendIds = friendIdsOf(u.getUserId());
        int mutuals = (int) theirFriendIds.stream().filter(myFriendIds::contains).count();

        String relationship = "NONE";
        if (myFriendIds.contains(u.getUserId())) {
            relationship = "FRIENDS";
        } else {
            Optional<FriendRequest> active = requestRepository.findActiveBetween(me.getUserId(), u.getUserId());
            if (active.isPresent() && active.get().getStatus() == FriendRequest.Status.PENDING) {
                relationship = active.get().getSender().getUserId().equals(me.getUserId()) ? "PENDING_SENT" : "PENDING_RECEIVED";
            }
        }

        return new PersonResponse(u.getUserId(), u.getUserName(), u.getName(), u.getAvatarUrl(), u.getBio(), u.getSmilePoint(), mutuals, relationship);
    }
}
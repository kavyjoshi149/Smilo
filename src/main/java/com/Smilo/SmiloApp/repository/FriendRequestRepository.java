package com.Smilo.SmiloApp.repository;

import com.Smilo.SmiloApp.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, String> {

    @Query("SELECT r FROM FriendRequest r WHERE ((r.sender.userId = :u1 AND r.receiver.userId = :u2) OR (r.sender.userId = :u2 AND r.receiver.userId = :u1)) AND r.status <> 'DECLINED'")
    Optional<FriendRequest> findActiveBetween(@Param("u1") String u1, @Param("u2") String u2);

    List<FriendRequest> findByReceiver_UserIdAndStatus(String receiverId, FriendRequest.Status status);
    List<FriendRequest> findBySender_UserIdAndStatus(String senderId, FriendRequest.Status status);

    @Query("SELECT r FROM FriendRequest r WHERE (r.sender.userId = :userId OR r.receiver.userId = :userId) AND r.status = 'ACCEPTED'")
    List<FriendRequest> findAcceptedForUser(@Param("userId") String userId);
}
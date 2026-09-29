package com.Smilo.SmiloApp.configuration;

import com.Smilo.SmiloApp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // Retrieve the ACTUAL accessor already embedded in this message
        // (not a new wrapper) — required for setUser() to persist for
        // the whole STOMP session, not just this one frame.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");


            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String userName = jwtService.extractUserName(token);


                if (userName != null) {
                    accessor.setUser(new UsernamePasswordAuthenticationToken(userName, null, List.of()));

                }
            }
        }

        return message; // no need to rebuild — the embedded accessor was mutated directly
    }
}
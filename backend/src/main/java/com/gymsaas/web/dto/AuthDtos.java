package com.gymsaas.web.dto;

import com.gymsaas.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100, message = "debe tener al menos 8 caracteres") String password,
            @Size(max = 120) String gymName,
            @Size(max = 30) String phone) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserResponse(Long id, String fullName, String email, String phone, String role,
                               String subscriptionStatus, Instant trialEndsAt,
                               Instant subscriptionEndsAt, boolean hasActiveAccess) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole().name(),
                    u.getSubscriptionStatus().name(), u.getTrialEndsAt(), u.getSubscriptionEndsAt(),
                    u.hasActiveAccess());
        }
    }

    public record AuthResponse(String token, UserResponse user) {}
}

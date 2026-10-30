package com.gymsaas.security;

import com.gymsaas.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/** Authenticated principal; wraps the user id so controllers never trust ids sent by the client. */
public record AuthUser(Long id, String email, String password, String role) implements UserDetails {

    public static AuthUser from(User u) {
        return new AuthUser(u.getId(), u.getEmail(), u.getPassword(), u.getRole().name());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
}

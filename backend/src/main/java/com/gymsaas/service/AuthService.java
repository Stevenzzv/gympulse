package com.gymsaas.service;

import com.gymsaas.config.AppProperties;
import com.gymsaas.domain.Gym;
import com.gymsaas.domain.Role;
import com.gymsaas.domain.SubscriptionStatus;
import com.gymsaas.domain.User;
import com.gymsaas.repository.GymRepository;
import com.gymsaas.repository.UserRepository;
import com.gymsaas.security.JwtService;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.AuthDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository users;
    private final GymRepository gyms;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;
    private final AppProperties props;

    public AuthService(UserRepository users, GymRepository gyms, PasswordEncoder encoder,
                       AuthenticationManager authManager, JwtService jwt, AppProperties props) {
        this.users = users;
        this.gyms = gyms;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwt = jwt;
        this.props = props;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con este email");
        }
        User u = new User();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        if (req.phone() != null && !req.phone().isBlank()) u.setPhone(req.phone().trim());
        if (props.isAdminEmail(email)) u.setRole(Role.ADMIN);
        u.setSubscriptionStatus(SubscriptionStatus.TRIAL);
        u.setTrialEndsAt(Instant.now().plus(Duration.ofDays(props.subscription().trialDays())));
        users.save(u);

        if (req.gymName() != null && !req.gymName().isBlank()) {
            Gym g = new Gym();
            g.setName(req.gymName().trim());
            g.setOwner(u);
            gyms.save(g);
        }
        return new AuthResponse(jwt.issue(u), UserResponse.from(u));
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email().trim(), req.password()));
        User u = users.findByEmailIgnoreCase(req.email().trim()).orElseThrow();
        return new AuthResponse(jwt.issue(u), UserResponse.from(u));
    }

    public User get(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
    }
}

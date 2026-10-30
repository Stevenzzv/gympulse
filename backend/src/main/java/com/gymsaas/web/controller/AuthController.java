package com.gymsaas.web.controller;

import com.gymsaas.security.AuthUser;
import com.gymsaas.service.AuthService;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.AuthDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser me) {
        if (me == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "No has iniciado sesión");
        return UserResponse.from(auth.get(me.id()));
    }
}

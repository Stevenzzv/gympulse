package com.gymsaas.security;

import com.gymsaas.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * When the trial / paid period is over, data stays readable but every write is rejected
 * with 402 Payment Required until the owner renews through PayPal.
 */
public class SubscriptionGuardFilter extends OncePerRequestFilter {

    private final UserRepository users;

    public SubscriptionGuardFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String path = req.getRequestURI();
        return HttpMethod.GET.matches(req.getMethod())
                || !path.startsWith("/api/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/billing")
                || path.startsWith("/api/paypal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser principal) {
            boolean active = users.findById(principal.id()).map(u -> u.hasActiveAccess()).orElse(false);
            if (!active) {
                res.setStatus(HttpServletResponse.SC_PAYMENT_REQUIRED);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"status\":402,\"message\":\"Tu suscripción venció. Renuévala en Suscripción para seguir guardando datos.\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}

package com.gymsaas.web.controller;

import com.gymsaas.domain.PaymentStatus;
import com.gymsaas.service.AdminService;
import com.gymsaas.web.dto.BillingDtos.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** SaaS operator endpoints; SecurityConfig restricts /api/admin/** to ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    @GetMapping("/summary")
    public AdminSummary summary() {
        return admin.summary();
    }

    @GetMapping("/payments")
    public List<AdminPaymentResponse> payments(@RequestParam(required = false) PaymentStatus status) {
        return admin.payments(status);
    }

    @PostMapping("/payments/{paymentId}/approve")
    public AdminPaymentResponse approve(@PathVariable Long paymentId, @Valid @RequestBody(required = false) ReviewRequest req) {
        return admin.approve(paymentId, req);
    }

    @PostMapping("/payments/{paymentId}/reject")
    public AdminPaymentResponse reject(@PathVariable Long paymentId, @Valid @RequestBody ReviewRequest req) {
        return admin.reject(paymentId, req);
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return admin.users();
    }

    @PostMapping("/users/{userId}/activate")
    public PaymentResponse activate(@PathVariable Long userId, @Valid @RequestBody ManualActivationRequest req) {
        return admin.activate(userId, req);
    }
}

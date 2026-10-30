package com.gymsaas;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymsaas.domain.SubscriptionStatus;
import com.gymsaas.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;

    private JsonNode call(String method, String url, String token, Object body, ResultMatcher expect) throws Exception {
        var req = request(org.springframework.http.HttpMethod.valueOf(method), url).contentType(MediaType.APPLICATION_JSON);
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.content(json.writeValueAsString(body));
        String res = mvc.perform(req).andExpect(expect).andReturn().getResponse().getContentAsString();
        return res.isBlank() ? null : json.readTree(res);
    }

    private String register(String gymName) throws Exception {
        return registerAs(UUID.randomUUID() + "@test.com", gymName);
    }

    /** The test profile keeps the default ADMIN_EMAILS (admin@gymsaas.app); tests may run in any order. */
    private String adminToken() throws Exception {
        if (users.findByEmailIgnoreCase("admin@gymsaas.app").isEmpty()) return registerAs("admin@gymsaas.app", "Admin Gym");
        return call("POST", "/api/auth/login", null,
                java.util.Map.of("email", "admin@gymsaas.app", "password", "secret123"), status().isOk())
                .get("token").asText();
    }

    private String registerAs(String email, String gymName) throws Exception {
        var body = java.util.Map.of("fullName", "Owner", "email", email,
                "password", "secret123", "gymName", gymName);
        return call("POST", "/api/auth/register", null, body, status().isCreated()).get("token").asText();
    }

    @Test
    void fullOwnerFlow() throws Exception {
        String token = register("My Gym");
        long gymId = call("GET", "/api/gyms", token, null, status().isOk()).get(0).get("id").asLong();

        long planId = call("POST", "/api/gyms/" + gymId + "/plans", token,
                java.util.Map.of("name", "Monthly", "price", 30, "durationDays", 30), status().isCreated())
                .get("id").asLong();

        long memberId = call("POST", "/api/gyms/" + gymId + "/members", token,
                java.util.Map.of("firstName", "Ana", "lastName", "Pérez", "observations", "Bad knee"),
                status().isCreated()).get("id").asLong();

        // Selling a plan to a member fills concept/amount from the plan and extends the membership
        JsonNode sale = call("POST", "/api/gyms/" + gymId + "/sales", token,
                java.util.Map.of("memberId", memberId, "planId", planId, "paymentMethod", "CARD"), status().isCreated());
        assertThat(sale.get("amount").decimalValue()).isEqualByComparingTo("30");
        assertThat(sale.get("concept").asText()).isEqualTo("Monthly");

        JsonNode member = call("GET", "/api/gyms/" + gymId + "/members/" + memberId, token, null, status().isOk());
        assertThat(member.get("membershipEndsAt").asText()).isEqualTo(LocalDate.now().plusDays(30).toString());
        assertThat(member.get("planName").asText()).isEqualTo("Monthly");

        call("POST", "/api/gyms/" + gymId + "/sales", token,
                java.util.Map.of("concept", "Protein shake", "amount", 4.5), status().isCreated());

        JsonNode stats = call("GET", "/api/gyms/" + gymId + "/stats", token, null, status().isOk());
        assertThat(stats.get("revenueThisMonth").decimalValue()).isEqualByComparingTo("34.5");
        assertThat(stats.get("salesThisMonth").asLong()).isEqualTo(2);
        assertThat(stats.get("membersWithValidPlan").asLong()).isEqualTo(1);
        assertThat(stats.get("monthly")).hasSize(12);

        JsonNode search = call("GET", "/api/gyms/" + gymId + "/members?q=ana", token, null, status().isOk());
        assertThat(search.get("totalElements").asLong()).isEqualTo(1);
    }

    @Test
    void ownersCannotSeeEachOthersGyms() throws Exception {
        String alice = register("Alice Gym");
        String bob = register("Bob Gym");
        long aliceGym = call("GET", "/api/gyms", alice, null, status().isOk()).get(0).get("id").asLong();

        call("GET", "/api/gyms/" + aliceGym + "/members", bob, null, status().isNotFound());
        call("DELETE", "/api/gyms/" + aliceGym, bob, null, status().isNotFound());
        call("GET", "/api/gyms", null, null, status().isUnauthorized());
    }

    @Test
    void expiredSubscriptionIsReadOnlyUntilPaid() throws Exception {
        String token = register("Expired Gym");
        long userId = call("GET", "/api/auth/me", token, null, status().isOk()).get("id").asLong();
        var u = users.findById(userId).orElseThrow();
        u.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
        u.setTrialEndsAt(Instant.now().minusSeconds(60));
        users.save(u);

        call("GET", "/api/gyms", token, null, status().isOk());
        call("POST", "/api/gyms", token, java.util.Map.of("name", "Another"), status().isPaymentRequired());

        call("POST", "/api/billing/simulate", token, null, status().isOk());
        assertThat(call("GET", "/api/billing", token, null, status().isOk())
                .get("subscriptionStatus").asText()).isEqualTo("ACTIVE");
        call("POST", "/api/gyms", token, java.util.Map.of("name", "Another"), status().isCreated());
    }

    @Test
    void transferPaymentIsActivatedOnlyAfterAdminApproval() throws Exception {
        String owner = register("Quito Gym");
        String admin = adminToken();

        var receipt = new org.springframework.mock.web.MockMultipartFile(
                "receipt", "comprobante.png", "image/png", new byte[]{1, 2, 3});
        String res = mvc.perform(multipart("/api/billing/manual-payments").file(receipt)
                        .param("planCode", "QUARTERLY").param("method", "TRANSFER").param("reference", "PICH-123")
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long paymentId = json.readTree(res).get("id").asLong();
        assertThat(json.readTree(res).get("status").asText()).isEqualTo("PENDING");

        // A second report while one is pending is refused
        mvc.perform(multipart("/api/billing/manual-payments")
                        .param("planCode", "MONTHLY").param("method", "DEUNA").param("reference", "X")
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isConflict());

        // Owners can't use admin endpoints
        call("GET", "/api/admin/payments", owner, null, status().isForbidden());
        call("POST", "/api/admin/payments/" + paymentId + "/approve", owner, null, status().isForbidden());

        JsonNode pending = call("GET", "/api/admin/payments?status=PENDING", admin, null, status().isOk());
        assertThat(pending.findValuesAsText("id")).contains(String.valueOf(paymentId));
        mvc.perform(get("/api/admin/payments/" + paymentId + "/receipt").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType("image/png"));

        call("POST", "/api/admin/payments/" + paymentId + "/approve", admin, java.util.Map.of("adminNote", "OK"), status().isOk());
        call("POST", "/api/admin/payments/" + paymentId + "/approve", admin, null, status().isConflict());

        JsonNode billing = call("GET", "/api/billing", owner, null, status().isOk());
        assertThat(billing.get("subscriptionStatus").asText()).isEqualTo("ACTIVE");
        assertThat(billing.get("hasPendingPayment").asBoolean()).isFalse();
        // 14-day trial + 3 months
        Instant endsAt = Instant.parse(billing.get("subscriptionEndsAt").asText());
        assertThat(endsAt).isAfter(Instant.now().plus(java.time.Duration.ofDays(14 + 88)));
    }

    @Test
    void rejectedPaymentNeedsAReasonAndDoesNotActivate() throws Exception {
        String owner = register("Guayaquil Gym");
        String admin = adminToken();
        String res = mvc.perform(multipart("/api/billing/manual-payments")
                        .param("planCode", "MONTHLY").param("method", "DEUNA").param("reference", "DEUNA-9")
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long paymentId = json.readTree(res).get("id").asLong();

        call("POST", "/api/admin/payments/" + paymentId + "/reject", admin, java.util.Map.of(), status().isBadRequest());
        call("POST", "/api/admin/payments/" + paymentId + "/reject", admin,
                java.util.Map.of("adminNote", "No encontramos la transferencia"), status().isOk());

        JsonNode billing = call("GET", "/api/billing", owner, null, status().isOk());
        assertThat(billing.get("subscriptionStatus").asText()).isEqualTo("TRIAL");
        assertThat(billing.get("payments").get(0).get("adminNote").asText()).isEqualTo("No encontramos la transferencia");
    }

    @Test
    void validationErrorsAreReported() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"\",\"email\":\"bad\",\"password\":\"1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }
}

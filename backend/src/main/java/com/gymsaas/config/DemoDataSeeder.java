package com.gymsaas.config;

import com.gymsaas.domain.*;
import com.gymsaas.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/** Creates a demo account with a year of realistic data. Enabled with app.seed-demo=true (dev only). */
@Component
@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String DEMO_EMAIL = "demo@gymsaas.app";
    public static final String DEMO_PASSWORD = "demo1234";
    public static final String ADMIN_EMAIL = "admin@gymsaas.app";
    public static final String ADMIN_PASSWORD = "admin1234";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String[] FIRST = {"Ana", "Luis", "María", "Carlos", "Sofía", "Diego", "Valentina", "Jorge",
            "Camila", "Andrés", "Lucía", "Mateo", "Daniela", "Pablo", "Isabella", "Miguel", "Paula", "Sebastián"};
    private static final String[] LAST = {"García", "Martínez", "López", "Rodríguez", "Pérez", "Gómez", "Sánchez",
            "Vaca", "Torres", "Ramírez", "Flores", "Rivera", "Morales", "Castro"};
    private static final String[] NOTES = {null, null, null, "Lesión de rodilla: evitar sentadillas pesadas", "Quiere bajar 5 kg",
            "Asma, tener el inhalador a mano", "Prefiere clases en la mañana", "Entrena para una maratón", "Referido por un amigo"};

    private final UserRepository users;
    private final GymRepository gyms;
    private final MembershipPlanRepository plans;
    private final MemberRepository members;
    private final SaleRepository sales;
    private final SubscriptionPaymentRepository payments;
    private final PasswordEncoder encoder;

    public DemoDataSeeder(UserRepository users, GymRepository gyms, MembershipPlanRepository plans,
                          MemberRepository members, SaleRepository sales, SubscriptionPaymentRepository payments,
                          PasswordEncoder encoder) {
        this.users = users;
        this.gyms = gyms;
        this.plans = plans;
        this.members = members;
        this.sales = sales;
        this.payments = payments;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByEmailIgnoreCase(DEMO_EMAIL)) return;
        Random rnd = new Random(42);

        User u = new User();
        u.setFullName("Dueño Demo");
        u.setPhone("+593 99 123 4567");
        u.setEmail(DEMO_EMAIL);
        u.setPassword(encoder.encode(DEMO_PASSWORD));
        u.setSubscriptionStatus(SubscriptionStatus.TRIAL);
        u.setTrialEndsAt(Instant.now().plus(Duration.ofDays(7)));
        users.save(u);

        Gym gym = new Gym();
        gym.setName("Iron Temple Fitness");
        gym.setAddress("Av. Amazonas N34-120, Quito");
        gym.setPhone("+593 99 999 9999");
        gym.setOwner(u);
        gyms.save(gym);

        List<MembershipPlan> planList = List.of(
                plan(gym, "Pase diario", "5.00", 1, "Acceso por un día"),
                plan(gym, "Mensual", "35.00", 30, "Acceso ilimitado por 30 días"),
                plan(gym, "Trimestral", "90.00", 90, "3 meses, ahorra 15%"),
                plan(gym, "Anual", "320.00", 365, "El mejor precio: 12 meses"));
        plans.saveAll(planList);

        LocalDate today = LocalDate.now();
        List<Member> memberList = new ArrayList<>();
        for (int i = 0; i < 85; i++) {
            Member m = new Member();
            m.setGym(gym);
            m.setFirstName(FIRST[rnd.nextInt(FIRST.length)]);
            m.setLastName(LAST[rnd.nextInt(LAST.length)]);
            m.setEmail(m.getFirstName().toLowerCase().replaceAll("[^a-z]", "") + i + "@example.com");
            m.setPhone("+593 9" + (10000000 + rnd.nextInt(89999999)));
            m.setObservations(NOTES[rnd.nextInt(NOTES.length)]);
            // More sign-ups in recent months to show growth.
            int daysAgo = (int) (365 * Math.pow(rnd.nextDouble(), 1.4));
            m.setJoinedAt(today.minusDays(daysAgo));
            memberList.add(m);
        }
        members.saveAll(memberList);

        List<Sale> saleList = new ArrayList<>();
        for (Member m : memberList) {
            LocalDate cursor = m.getJoinedAt();
            MembershipPlan p = planList.get(1 + rnd.nextInt(3));
            while (!cursor.isAfter(today)) {
                if (rnd.nextDouble() < 0.12) break; // churn
                saleList.add(sale(gym, m, p, cursor.atTime(7 + rnd.nextInt(13), rnd.nextInt(60)), rnd));
                m.setPlan(p);
                m.setMembershipEndsAt(cursor.plusDays(p.getDurationDays()));
                cursor = cursor.plusDays(p.getDurationDays());
            }
            if (m.getMembershipEndsAt() == null || m.getMembershipEndsAt().isBefore(today.minusDays(60))) {
                m.setStatus(MemberStatus.INACTIVE);
            }
        }
        String[] extras = {"Batido de proteína", "Botella de agua", "Sesión de entrenamiento personal", "Camiseta del gym"};
        String[] extraPrices = {"3.50", "1.00", "20.00", "15.00"};
        for (int i = 0; i < 260; i++) {
            int k = rnd.nextInt(extras.length);
            Sale s = new Sale();
            s.setGym(gym);
            s.setConcept(extras[k]);
            s.setAmount(new BigDecimal(extraPrices[k]));
            s.setPaymentMethod(PaymentMethod.values()[rnd.nextInt(3)]);
            s.setSoldAt(today.minusDays(rnd.nextInt(365)).atTime(8 + rnd.nextInt(12), rnd.nextInt(60)));
            saleList.add(s);
        }
        sales.saveAll(saleList);
        seedSaasCustomers();
        log.info("Demo data created — owner {} / {}, admin {} / {}", DEMO_EMAIL, DEMO_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private static MembershipPlan plan(Gym gym, String name, String price, int days, String desc) {
        MembershipPlan p = new MembershipPlan();
        p.setGym(gym);
        p.setName(name);
        p.setPrice(new BigDecimal(price));
        p.setDurationDays(days);
        p.setDescription(desc);
        return p;
    }

    private static Sale sale(Gym gym, Member m, MembershipPlan p, LocalDateTime at, Random rnd) {
        Sale s = new Sale();
        s.setGym(gym);
        s.setMember(m);
        s.setPlan(p);
        s.setConcept(p.getName());
        s.setAmount(p.getPrice());
        s.setPaymentMethod(PaymentMethod.values()[rnd.nextInt(PaymentMethod.values().length - 1)]);
        s.setSoldAt(at);
        return s;
    }

    /** SaaS-side demo: an admin plus a few customers so the admin panel has something to review. */
    private void seedSaasCustomers() {
        User admin = owner("Administrador", ADMIN_EMAIL, ADMIN_PASSWORD, null);
        admin.setRole(Role.ADMIN);

        User pending = owner("Carlos Andrade", "carlos@crossfitquito.ec", "demo1234", "+593 98 765 4321");
        SubscriptionPayment transfer = new SubscriptionPayment();
        transfer.setUser(pending);
        transfer.setMethod(SubscriptionPaymentMethod.TRANSFER);
        transfer.setPlanCode("QUARTERLY");
        transfer.setMonths(3);
        transfer.setAmount(new BigDecimal("79.00"));
        transfer.setCurrency("USD");
        transfer.setReference("PICH-458812093");
        transfer.setPayerNote("Transferí desde Produbanco");
        payments.save(transfer);

        User expiring = owner("María Salazar", "maria@powergym.ec", "demo1234", "+593 99 555 0101");
        expiring.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        expiring.setTrialEndsAt(Instant.now().minus(Duration.ofDays(40)));
        expiring.setSubscriptionEndsAt(Instant.now().plus(Duration.ofDays(5)));
        SubscriptionPayment deuna = new SubscriptionPayment();
        deuna.setUser(expiring);
        deuna.setMethod(SubscriptionPaymentMethod.DEUNA);
        deuna.setStatus(PaymentStatus.APPROVED);
        deuna.setPlanCode("MONTHLY");
        deuna.setMonths(1);
        deuna.setAmount(new BigDecimal("29.00"));
        deuna.setCurrency("USD");
        deuna.setReference("DEUNA-77120");
        deuna.setReviewedAt(Instant.now().minus(Duration.ofDays(25)));
        payments.save(deuna);
    }

    private User owner(String name, String email, String password, String phone) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        u.setPhone(phone);
        u.setTrialEndsAt(Instant.now().plus(Duration.ofDays(7)));
        return users.save(u);
    }
}

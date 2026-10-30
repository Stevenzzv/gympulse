package com.gymsaas.config;

import com.gymsaas.domain.Role;
import com.gymsaas.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Promotes already-registered accounts listed in app.admin-emails (ADMIN_EMAILS) to ADMIN on startup. */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppProperties props;
    private final UserRepository users;

    public AdminBootstrap(AppProperties props, UserRepository users) {
        this.props = props;
        this.users = users;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (props.adminEmails() == null) return;
        props.adminEmails().stream().filter(e -> e != null && !e.isBlank()).forEach(email ->
                users.findByEmailIgnoreCase(email.trim()).filter(u -> u.getRole() != Role.ADMIN).ifPresent(u -> {
                    u.setRole(Role.ADMIN);
                    log.info("Promoted {} to ADMIN", u.getEmail());
                }));
    }
}

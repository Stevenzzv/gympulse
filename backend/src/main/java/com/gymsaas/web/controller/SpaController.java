package com.gymsaas.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * In production the React build is served by Spring Boot (see the root Dockerfile). Browser routes
 * like /app/members must return index.html so React Router can render them on reload.
 */
@Controller
public class SpaController {

    @GetMapping({"/", "/login", "/register", "/terminos", "/privacidad", "/app", "/app/**"})
    public String index() {
        return "forward:/index.html";
    }
}

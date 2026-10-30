package com.gymsaas.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Lets DB_URL be pasted exactly as Neon / Render / Railway show it
 * ({@code postgresql://user:pass@host:5432/db?sslmode=require}) by turning it into the JDBC form Spring needs
 * ({@code jdbc:postgresql://host:5432/db?sslmode=require}) plus username and password.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication application) {
        String raw = env.getProperty("DB_URL");
        if (raw == null) return;
        Map<String, Object> props = normalize(raw);
        if (!props.isEmpty()) env.getPropertySources().addFirst(new MapPropertySource("normalizedDbUrl", props));
    }

    /** Returns the datasource properties to override, or an empty map when the URL is already fine. */
    static Map<String, Object> normalize(String raw) {
        Map<String, Object> props = new HashMap<>();
        String url = raw.trim();
        if (url.startsWith("jdbc:")) url = url.substring(5);
        if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) return props;

        String rest = url.substring(url.indexOf("://") + 3);
        int at = rest.lastIndexOf('@', rest.indexOf('/') < 0 ? rest.length() : rest.indexOf('/'));
        if (at >= 0) {
            String userInfo = rest.substring(0, at);
            rest = rest.substring(at + 1);
            int colon = userInfo.indexOf(':');
            props.put("spring.datasource.username", decode(colon < 0 ? userInfo : userInfo.substring(0, colon)));
            if (colon >= 0) props.put("spring.datasource.password", decode(userInfo.substring(colon + 1)));
        }
        props.put("spring.datasource.url", "jdbc:postgresql://" + rest);
        return props;
    }

    private static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }
}

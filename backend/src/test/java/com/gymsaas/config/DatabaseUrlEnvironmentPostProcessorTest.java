package com.gymsaas.config;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlEnvironmentPostProcessorTest {

    @Test
    void convertsNeonStyleUrl() {
        var p = DatabaseUrlEnvironmentPostProcessor.normalize(
                "postgresql://neondb_owner:p%40ss:w0rd@ep-cool-1.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
        assertThat(p).containsEntry("spring.datasource.url",
                        "jdbc:postgresql://ep-cool-1.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require")
                .containsEntry("spring.datasource.username", "neondb_owner")
                .containsEntry("spring.datasource.password", "p@ss:w0rd");
    }

    @Test
    void convertsRenderStyleUrlWithJdbcPrefixAndPort() {
        var p = DatabaseUrlEnvironmentPostProcessor.normalize("jdbc:postgres://u:pw@dpg-abc.oregon-postgres.render.com:5432/gym");
        assertThat(p).isEqualTo(Map.of(
                "spring.datasource.url", "jdbc:postgresql://dpg-abc.oregon-postgres.render.com:5432/gym",
                "spring.datasource.username", "u",
                "spring.datasource.password", "pw"));
    }

    @Test
    void keepsPlusSignsInPasswords() {
        var p = DatabaseUrlEnvironmentPostProcessor.normalize("postgresql://u:a+b%2Bc@host/db");
        assertThat(p).containsEntry("spring.datasource.password", "a+b+c");
    }

    @Test
    void leavesJdbcUrlsWithoutCredentialsAlone() {
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize("jdbc:postgresql://host:5432/db"))
                .containsOnlyKeys("spring.datasource.url")
                .containsEntry("spring.datasource.url", "jdbc:postgresql://host:5432/db");
        assertThat(DatabaseUrlEnvironmentPostProcessor.normalize("jdbc:h2:mem:test")).isEmpty();
    }
}

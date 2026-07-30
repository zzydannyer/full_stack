package com.fullstack.springapi.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseConfig {

    @Bean
    @Qualifier("postgresqlDataSource")
    public DataSource postgresqlDataSource(@Value("${POSTGRESQL_URL}") String url) {
        return createDataSource(url, "postgresql", "PostgreSQL");
    }

    @Bean
    @Qualifier("mysqlDataSource")
    public DataSource mysqlDataSource(@Value("${MYSQL_URL}") String url) {
        return createDataSource(url, "mysql", "MySQL");
    }

    private DataSource createDataSource(String url, String scheme, String poolName) {
        HikariConfig config = new HikariConfig();
        config.setPoolName(poolName);
        URI uri = URI.create(url);
        String[] credentials = uri.getRawUserInfo().split(":", 2);
        config.setJdbcUrl(
                "jdbc:" + scheme + "://" + uri.getHost() + ":" + uri.getPort() + uri.getRawPath());
        config.setUsername(URLDecoder.decode(credentials[0], StandardCharsets.UTF_8));
        config.setPassword(URLDecoder.decode(credentials[1], StandardCharsets.UTF_8));
        return new HikariDataSource(config);
    }
}

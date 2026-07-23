package com.baaki.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Only spring-security-crypto is on the classpath (not spring-boot-starter-security),
 * so this is just a hashing utility bean — no filter chain, no login form, no auth
 * wiring. JWT auth (§4 /auth/register, /auth/login) is a separate, later piece of work.
 */
@Configuration
public class SecurityBeansConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}

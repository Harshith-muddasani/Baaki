package com.baaki.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The Vite dev server (and the deployed static frontend) run on a
 * different origin than the API. ALLOWED_ORIGINS is a comma-separated
 * list so the deployed frontend's URL can be added alongside localhost
 * without removing local dev access.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${ALLOWED_ORIGINS:http://localhost:5173}")
	private String allowedOrigins;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
				.allowedOrigins(allowedOrigins.split("\\s*,\\s*"))
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
				.allowedHeaders("*");
	}
}

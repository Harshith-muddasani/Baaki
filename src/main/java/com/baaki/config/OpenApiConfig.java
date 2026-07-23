package com.baaki.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI baakiOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("Baaki API")
						.description("Splitwise-style expense settlement backend")
						.version("v1"));
	}
}

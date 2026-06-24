package com.smartcommerce.catalog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OrderClientConfig {

  @Bean
  RestClient orderRestClient(@Value("${app.order-service.url:http://localhost:8094}") String orderServiceUrl) {
    return RestClient.builder()
        .baseUrl(orderServiceUrl)
        .build();
  }
}

package com.smartcommerce.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class OrderServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderServiceApplication.class, args);
  }

  @Bean
  RestClient catalogClient(RestClient.Builder builder) {
    return builder.baseUrl(System.getenv().getOrDefault("CATALOG_SERVICE_URL", "http://localhost:8093")).build();
  }
}

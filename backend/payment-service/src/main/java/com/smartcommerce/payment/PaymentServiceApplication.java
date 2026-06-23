package com.smartcommerce.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class PaymentServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(PaymentServiceApplication.class, args);
  }

  @Bean
  RestClient orderClient(RestClient.Builder builder) {
    return builder.baseUrl(System.getenv().getOrDefault("ORDER_SERVICE_URL", "http://localhost:8094")).build();
  }
}

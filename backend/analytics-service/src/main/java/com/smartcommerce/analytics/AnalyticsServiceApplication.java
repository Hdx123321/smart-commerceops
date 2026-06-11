package com.smartcommerce.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class AnalyticsServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(AnalyticsServiceApplication.class, args);
  }

  @Bean
  RestClient restClient(RestClient.Builder builder) {
    return builder.build();
  }
}

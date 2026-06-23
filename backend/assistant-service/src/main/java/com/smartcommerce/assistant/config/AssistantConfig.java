package com.smartcommerce.assistant.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestClient;

@Configuration
public class AssistantConfig {

  @Bean
  RestClient catalogRestClient(
      @Value("${assistant.catalog.url}") String catalogUrl,
      @Value("${assistant.timeout-seconds:30}") int timeoutSeconds) {
    return RestClient.builder()
        .baseUrl(catalogUrl)
        .build();
  }

  @Bean
  RestClient llmRestClient(
      @Value("${assistant.llm.base-url}") String llmBaseUrl,
      @Value("${assistant.llm.api-key}") String llmApiKey,
      @Value("${assistant.timeout-seconds:30}") int timeoutSeconds) {
    return RestClient.builder()
        .baseUrl(llmBaseUrl)
        .defaultHeader("Authorization", "Bearer " + llmApiKey)
        .defaultHeader("Content-Type", "application/json")
        .build();
  }

  @Bean
  ThreadPoolTaskExecutor sseTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.setMaxPoolSize(10);
    executor.setQueueCapacity(20);
    executor.setThreadNamePrefix("sse-");
    executor.initialize();
    return executor;
  }
}

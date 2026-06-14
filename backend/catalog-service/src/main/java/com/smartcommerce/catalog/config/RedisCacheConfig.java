package com.smartcommerce.catalog.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

@Configuration
@EnableCaching
@EnableConfigurationProperties(RedisCacheConfig.CatalogCacheProperties.class)
public class RedisCacheConfig {

  @Bean
  RedisCacheConfiguration redisCacheConfiguration(CatalogCacheProperties properties) {
    return RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(properties.ttl())
        .disableCachingNullValues()
        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.java()));
  }

  @ConfigurationProperties(prefix = "app.cache.catalog")
  public record CatalogCacheProperties(Duration ttl) {
    public CatalogCacheProperties {
      if (ttl == null) {
        ttl = Duration.ofMinutes(5);
      }
    }
  }
}

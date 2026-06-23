package com.smartcommerce.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class LlmClient {

  private static final Logger log = LoggerFactory.getLogger(LlmClient.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private final RestClient restClient;
  private final String model;
  private final String baseUrl;

  public LlmClient(@Qualifier("llmRestClient") RestClient restClient,
                   @Value("${assistant.llm.model:deepseek-v4-flash}") String model,
                   @Value("${assistant.llm.base-url}") String baseUrl) {
    this.restClient = restClient;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  /**
   * Call LLM (DeepSeek / OpenAI-compatible) with candidate product context.
   * Returns the raw JSON string from the model's content field.
   */
  public String recommend(String userQuery, List<CatalogProduct> candidates,
                          BigDecimal maxBudget, int limit) {
    String systemPrompt = buildSystemPrompt(candidates, maxBudget, limit);
    String userMessage = buildUserMessage(userQuery);

    Map<String, Object> body = Map.of(
        "model", model,
        "messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userMessage)
        ),
        "temperature", 0.3,
        "max_tokens", 1024
    );

    String fullPath = baseUrl + "/chat/completions";
    log.info("Calling LLM model={}, {} candidates, endpoint={}", model, candidates.size(), baseUrl);

    try {
      String response = restClient.post()
          .uri("/chat/completions")
          .body(body)
          .retrieve()
          .onStatus(status -> status.is4xxClientError(), (req, res) -> {
            byte[] bodyBytes = res.getBody().readAllBytes();
            String bodyText = new String(bodyBytes);
            log.error("LLM client error: status={}, response={}", res.getStatusCode(),
                summarize(bodyText));
            throw new LlmClientException(res.getStatusCode().value(),
                "LLM request rejected (client error " + res.getStatusCode().value() + ")",
                bodyText);
          })
          .onStatus(status -> status.is5xxServerError(), (req, res) -> {
            byte[] bodyBytes = res.getBody().readAllBytes();
            String bodyText = new String(bodyBytes);
            log.error("LLM server error: status={}, response={}", res.getStatusCode(),
                summarize(bodyText));
            throw new LlmClientException(res.getStatusCode().value(),
                "LLM service unavailable (server error " + res.getStatusCode().value() + ")",
                bodyText);
          })
          .body(String.class);

      return extractContent(response);
    } catch (LlmClientException e) {
      throw e;
    } catch (RestClientResponseException e) {
      log.error("LLM request failed: status={}, response={}", e.getStatusCode(),
          summarize(e.getResponseBodyAsString()));
      throw new LlmClientException(e.getStatusCode().value(),
          "LLM request failed: " + e.getStatusCode(), e.getResponseBodyAsString());
    } catch (Exception e) {
      log.error("LLM call failed (network or unexpected): {}", e.getMessage());
      throw new LlmClientException(-1, "LLM connection failed: " + e.getMessage(), null);
    }
  }

  /** Truncate response body for safe logging — never log the API key */
  private static String summarize(String body) {
    if (body == null) return "<empty>";
    if (body.length() <= 300) return body;
    return body.substring(0, 300) + "...";
  }

  private String extractContent(String responseBody) {
    try {
      JsonNode root = MAPPER.readTree(responseBody);
      return root.path("choices").path(0).path("message").path("content").asText();
    } catch (Exception e) {
      log.error("Failed to parse LLM response: {}", e.getMessage());
      throw new RuntimeException("Failed to parse LLM response", e);
    }
  }

  /** Custom exception carrying HTTP status and response body for the controller */
  public static class LlmClientException extends RuntimeException {
    private final int httpStatus;
    private final String responseBody;

    public LlmClientException(int httpStatus, String message, String responseBody) {
      super(message);
      this.httpStatus = httpStatus;
      this.responseBody = responseBody;
    }

    public int httpStatus() { return httpStatus; }
    public String responseBody() { return responseBody; }
  }

  private String buildSystemPrompt(List<CatalogProduct> candidates, BigDecimal maxBudget, int limit) {
    String candidateList = candidates.stream()
        .map(p -> String.format(
            "  {\"index\":%d,\"name\":\"%s\",\"price\":%.2f,\"category\":\"%s\",\"stock\":%d,\"rating\":%.1f,\"sales\":%d,\"merchant\":\"%s\"}",
            candidates.indexOf(p),
            escapeJson(p.name()),
            p.price(),
            escapeJson(p.category()),
            p.stockQuantity(),
            p.averageRating(),
            p.salesCount(),
            escapeJson(p.merchantName())
        ))
        .collect(Collectors.joining(",\n"));

    return String.format("""
        你是 Smart CommerceOps 的商品推荐助手。用户用中文描述需求，你用中文回复。

        规则：
        1. 只能推荐下面【候选商品列表】中的商品，不允许编造任何商品或字段。
        2. 候选商品的所有字段（名称、价格、分类、库存、评分、销量、商家）都是真实数据，不得修改。
        3. 推荐理由必须基于候选商品的实际字段。
        4. 如果没有合适的商品，在 summary 中诚实说明，recommendations 返回空数组。
        5. 最多推荐 %d 个商品。
        6. 最终输出必须是合法 JSON，只输出 JSON，不要加任何额外文字。

        【候选商品列表】（共 %d 件）
        [
        %s
        ]

        输出 JSON 格式：
        {
          "summary": "你的中文分析文字...",
          "recommendations": [
            {"productIndex": 0, "reason": "推荐理由（中文）..."}
          ]
        }

        注意：productIndex 是候选商品列表中该商品的 index 值，不是 productId。
        """, limit, candidates.size(), candidateList);
  }

  private String buildUserMessage(String userQuery) {
    return "用户需求：" + userQuery;
  }

  private static String escapeJson(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}

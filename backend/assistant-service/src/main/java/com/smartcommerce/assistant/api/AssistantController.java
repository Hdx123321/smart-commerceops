package com.smartcommerce.assistant.api;

import com.smartcommerce.assistant.service.AssistantService;
import com.smartcommerce.assistant.service.CatalogClient;
import com.smartcommerce.assistant.service.CatalogProduct;
import com.smartcommerce.assistant.service.FallbackRecommender;
import com.smartcommerce.assistant.service.LlmClient;
import com.smartcommerce.assistant.service.LlmClient.LlmClientException;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/assistant")
public class AssistantController {

  private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

  private final CatalogClient catalogClient;
  private final LlmClient llmClient;
  private final AssistantService assistantService;
  private final FallbackRecommender fallbackRecommender;
  private final ThreadPoolTaskExecutor taskExecutor;
  private final long emitterTimeoutMs;

  public AssistantController(CatalogClient catalogClient,
                             LlmClient llmClient,
                             AssistantService assistantService,
                             FallbackRecommender fallbackRecommender,
                             ThreadPoolTaskExecutor sseTaskExecutor,
                             @Value("${assistant.timeout-seconds:30}") int timeoutSeconds) {
    this.catalogClient = catalogClient;
    this.llmClient = llmClient;
    this.assistantService = assistantService;
    this.fallbackRecommender = fallbackRecommender;
    this.taskExecutor = sseTaskExecutor;
    this.emitterTimeoutMs = TimeUnit.SECONDS.toMillis(timeoutSeconds + 10);
  }

  /**
   * SSE streaming recommendation endpoint.
   * Frontend POSTs user query → backend streams token events → result event with validated products.
   */
  @PostMapping(value = "/recommend/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter recommendStream(@Valid @RequestBody AssistantRecommendRequest request) {
    SseEmitter emitter = new SseEmitter(emitterTimeoutMs);

    emitter.onTimeout(() -> log.warn("SSE emitter timed out"));
    emitter.onError(ex -> log.warn("SSE emitter error: {}", ex.getMessage()));

    taskExecutor.execute(() -> {
      List<CatalogProduct> candidates;
      try {
        // Step 1: Fetch from catalog-service
        candidates = catalogClient.fetchCandidates(request);
      } catch (Exception e) {
        // catalog failure → emit error, no fallback (no data to recommend)
        log.error("Catalog service unavailable", e);
        sendError(emitter, "Unable to fetch product data. Please try again later.");
        sendDone(emitter);
        return;
      }

      try {
        // Step 2: No candidates
        if (candidates.isEmpty()) {
          sendToken(emitter, "抱歉，没有找到符合您需求的商品。");
          sendToken(emitter, "请尝试调整搜索条件，例如更换分类或提高预算。");
          sendDone(emitter);
          return;
        }

        // Step 3: Progress tokens
        sendToken(emitter, "正在分析您的需求…");
        sendToken(emitter, String.format("已从 %d 件在售商品中为您智能筛选。", candidates.size()));

        // Step 4: Call LLM
        String llmResponse = llmClient.recommend(request.query(), candidates,
            request.maxBudget(), request.limit());

        // Step 5: Parse + validate
        AssistantRecommendResult result = assistantService.parseAndValidate(llmResponse, candidates, request);

        // Step 6: Emit result
        sendResult(emitter, result);
        sendDone(emitter);
      } catch (LlmClientException e) {
        // LLM-specific error with status code → decide fallback or direct error
        int status = e.httpStatus();
        log.error("LLM call failed: status={}, message={}", status, e.getMessage());

        if (status == 401 || status == 403) {
          // Auth error — no point in fallback, tell the user
          sendToken(emitter, "AI 服务认证失败，请联系管理员检查 API Key 配置。");
          sendError(emitter, "AI service authentication failed. Please contact the administrator.");
          sendDone(emitter);
        } else if (status == 404) {
          sendToken(emitter, "AI 模型服务不可用，请检查模型名称和 API 地址配置。");
          sendError(emitter, "AI model endpoint not found (404). Check LLM_API_BASE_URL and LLM_MODEL.");
          sendDone(emitter);
        } else if (status == 429) {
          sendToken(emitter, "AI 服务请求过于频繁，请稍后再试。");
          sendError(emitter, "AI service rate limited (429). Please try again later.");
          sendDone(emitter);
        } else if (status >= 500) {
          // Server error → fallback to rule-based recommender
          log.warn("LLM server error ({}), using fallback", status);
          try {
            sendToken(emitter, "AI 服务暂时繁忙，正在使用常规推荐引擎为您匹配商品…");
            AssistantRecommendResult fallback = fallbackRecommender.recommend(candidates, request);
            sendResult(emitter, fallback);
            sendDone(emitter);
          } catch (Exception e2) {
            log.error("Fallback also failed", e2);
            sendError(emitter, "AI assistant is temporarily unavailable. Please try again later.");
            sendDone(emitter);
          }
        } else {
          // Other client errors → fallback
          try {
            sendToken(emitter, "AI 服务暂时繁忙，正在使用常规推荐引擎为您匹配商品…");
            AssistantRecommendResult fallback = fallbackRecommender.recommend(candidates, request);
            sendResult(emitter, fallback);
            sendDone(emitter);
          } catch (Exception e2) {
            log.error("Fallback also failed", e2);
            sendError(emitter, "AI assistant is temporarily unavailable. Please try again later.");
            sendDone(emitter);
          }
        }
      } catch (Exception e) {
        // catalog OK, unexpected LLM fail → rule-based fallback
        log.error("Unexpected LLM error, using fallback", e);
        try {
          sendToken(emitter, "AI 服务暂时繁忙，正在使用常规推荐引擎为您匹配商品…");
          AssistantRecommendResult fallback = fallbackRecommender.recommend(candidates, request);
          sendResult(emitter, fallback);
          sendDone(emitter);
        } catch (Exception e2) {
          log.error("Fallback also failed", e2);
          sendError(emitter, "AI assistant is temporarily unavailable. Please try again later.");
          sendDone(emitter);
        }
      }
    });

    return emitter;
  }

  private void sendToken(SseEmitter emitter, String text) {
    try {
      emitter.send(SseEmitter.event()
          .name("token")
          .data("{\"text\":" + toJsonString(text) + "}"));
    } catch (IOException e) {
      log.warn("Failed to send token event: {}", e.getMessage());
    }
  }

  private void sendResult(SseEmitter emitter, AssistantRecommendResult result) {
    try {
      String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(result);
      emitter.send(SseEmitter.event()
          .name("result")
          .data(json));
    } catch (IOException e) {
      log.warn("Failed to send result event: {}", e.getMessage());
    }
  }

  private void sendError(SseEmitter emitter, String message) {
    try {
      emitter.send(SseEmitter.event()
          .name("error")
          .data("{\"message\":" + toJsonString(message) + "}"));
    } catch (IOException ex) {
      log.warn("Failed to send error event: {}", ex.getMessage());
    }
  }

  private void sendDone(SseEmitter emitter) {
    try {
      emitter.send(SseEmitter.event()
          .name("done")
          .data("{}"));
      emitter.complete();
    } catch (IOException e) {
      log.warn("Failed to send done event: {}", e.getMessage());
    }
  }

  private static String toJsonString(String s) {
    if (s == null) return "\"\"";
    return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
        .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t") + "\"";
  }
}

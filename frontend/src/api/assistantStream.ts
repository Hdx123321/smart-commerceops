import type {
  AssistantRecommendRequest,
  AssistantRecommendResult,
} from '../types';
import { assistantApi } from './client';

/**
 * Open an SSE stream for assistant recommendations.
 * Parses event: token / result / error / done from the stream.
 * Returns an AbortController so the caller can cancel mid-stream.
 */
export function streamAssistantRecommend(
  request: AssistantRecommendRequest,
  onToken: (text: string) => void,
  onResult: (result: AssistantRecommendResult) => void,
  onError: (message: string) => void,
  onDone: () => void,
): AbortController {
  const controller = new AbortController();

  (async () => {
    let response: Response;
    try {
      response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090'}/assistant/recommend/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        },
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // user cancelled — no error
      }
      onError('Network error. Please check your connection.');
      return;
    }

    if (!response.ok) {
      let msg: string;
      switch (response.status) {
        case 404:
          msg = 'AI 导购服务未启动，请联系管理员。';
          break;
        case 401:
        case 403:
          msg = 'AI 服务认证失败，请联系管理员检查配置。';
          break;
        case 429:
          msg = '请求过于频繁，请稍后再试。';
          break;
        default:
          if (response.status >= 500) {
            msg = 'AI 服务暂时不可用，正在使用常规推荐引擎为您匹配商品…';
          } else {
            msg = `服务异常 (${response.status})，请稍后重试。`;
          }
      }
      onError(msg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Streaming is not supported in this browser.');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processFrame = (frame: string) => {
      const lines = frame.split('\n');
      let eventType = '';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr = line.slice(5).trim();
        }
      }

      if (!eventType || !dataStr) return;

      try {
        const payload = JSON.parse(dataStr);
        switch (eventType) {
          case 'token':
            onToken(payload.text ?? '');
            break;
          case 'result':
            onResult(payload as AssistantRecommendResult);
            break;
          case 'error':
            onError(payload.message ?? 'Unknown error');
            break;
          case 'done':
            onDone();
            break;
        }
      } catch {
        // skip malformed frame
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Process any remaining complete frame in the buffer before exiting
          if (buffer.trim()) {
            processFrame(buffer);
          }
          // Ensure loading state is cleared even if no done event was parsed
          onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames: "event:...\ndata:...\n\n"  (space after colon is optional per spec)
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // keep incomplete last chunk

        for (const part of parts) {
          processFrame(part);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      onError('Stream interrupted. Please try again.');
    } finally {
      reader.releaseLock();
    }
  })();

  return controller;
}

import { describe, expect, it, vi } from "vitest";

import {
  completeWithFallback,
  type AssistantMessage,
} from "./assistant-providers";

const messages: AssistantMessage[] = [
  { role: "user", content: "Help me plan today." },
];

const providers = [
  {
    name: "groq" as const,
    apiKey: "groq-key",
    apiUrl: "https://groq.test",
    model: "groq-model",
    maxTokens: 1_200,
  },
  {
    name: "openrouter" as const,
    apiKey: "openrouter-key",
    apiUrl: "https://openrouter.test",
    model: "deepseek-model",
    maxTokens: 4_096,
  },
  {
    name: "openrouter" as const,
    apiKey: "openrouter-key",
    apiUrl: "https://openrouter.test",
    model: "openrouter/free",
    maxTokens: 4_096,
  },
];

function completion(content: string, model: string) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
      model,
    }),
    { status: 200 },
  );
}

describe("assistant provider fallback", () => {
  it("stops after a successful primary response", async () => {
    const fetcher = vi.fn(async () => completion("Groq answer", "groq-model"));

    const result = await completeWithFallback(providers, messages, fetcher);

    expect(result).toEqual({
      content: "Groq answer",
      model: "groq-model",
      provider: "groq",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses DeepSeek when Groq rejects the request", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(completion("DeepSeek answer", "deepseek-model"));

    const result = await completeWithFallback(providers, messages, fetcher);

    expect(result?.content).toBe("DeepSeek answer");
    expect(result?.provider).toBe("openrouter");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("uses the free router after an empty DeepSeek response", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("Groq unavailable"))
      .mockResolvedValueOnce(completion("  ", "deepseek-model"))
      .mockResolvedValueOnce(completion("Router answer", "free-model"));

    const result = await completeWithFallback(providers, messages, fetcher);

    expect(result?.content).toBe("Router answer");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("returns null when every provider fails", async () => {
    const fetcher = vi.fn(async () => new Response("error", { status: 503 }));

    await expect(
      completeWithFallback(providers, messages, fetcher),
    ).resolves.toBeNull();
  });
});

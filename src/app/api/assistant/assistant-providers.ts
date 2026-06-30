export type AssistantMessage = {
  role: "assistant" | "system" | "user";
  content: string;
};

type AssistantProvider = {
  name: "groq" | "openrouter";
  apiKey: string;
  apiUrl: string;
  model: string;
  maxTokens: number;
};

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  model?: string;
};

export type AssistantCompletion = {
  content: string;
  model?: string;
  provider: AssistantProvider["name"];
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export function configuredAssistantProviders(): AssistantProvider[] {
  const providers: AssistantProvider[] = [];
  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (groqApiKey) {
    providers.push({
      name: "groq",
      apiKey: groqApiKey,
      apiUrl: GROQ_API_URL,
      model:
        process.env.GROQ_MODEL ??
        "meta-llama/llama-4-scout-17b-16e-instruct",
      maxTokens: 1_200,
    });
  }

  if (openRouterApiKey) {
    providers.push(
      {
        name: "openrouter",
        apiKey: openRouterApiKey,
        apiUrl: OPENROUTER_API_URL,
        model:
          process.env.OPENROUTER_DEEPSEEK_MODEL ??
          "deepseek/deepseek-r1-0528:free",
        maxTokens: 4_096,
      },
      {
        name: "openrouter",
        apiKey: openRouterApiKey,
        apiUrl: OPENROUTER_API_URL,
        model: process.env.OPENROUTER_FALLBACK_MODEL ?? "openrouter/free",
        maxTokens: 4_096,
      },
    );
  }

  return providers;
}

export async function completeWithFallback(
  providers: AssistantProvider[],
  messages: AssistantMessage[],
  fetcher: typeof fetch = fetch,
): Promise<AssistantCompletion | null> {
  for (const provider of providers) {
    try {
      const response = await fetcher(provider.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          ...(provider.name === "groq"
            ? { max_completion_tokens: provider.maxTokens }
            : { max_tokens: provider.maxTokens }),
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) continue;

      const data = (await response.json()) as CompletionResponse;
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) continue;

      return {
        content,
        model: data.model,
        provider: provider.name,
      };
    } catch {
      continue;
    }
  }

  return null;
}

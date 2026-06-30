import { NextResponse } from "next/server";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 6_000;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === "assistant" || message.role === "user") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The assistant API key has not been configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).messages
      : null;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    !messages.every(isChatMessage)
  ) {
    return NextResponse.json(
      { error: "The conversation is empty or too large." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          process.env.GROQ_MODEL ??
          "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are Taskino's concise, practical AI assistant. Help users with planning, writing, analysis, and work questions. Reply in the same language as the user's latest message. Use clear formatting and never claim to have changed Taskino data.",
          },
          ...messages,
        ],
        max_completion_tokens: 1_200,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
      model?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "The free usage limit is busy or exhausted. Please try again shortly."
              : data.error?.message || "The AI provider rejected the request.",
        },
        { status: response.status },
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "The AI provider returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ content, model: data.model });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return NextResponse.json(
      {
        error: timedOut
          ? "The AI provider took too long to respond."
          : "The AI provider is currently unavailable.",
      },
      { status: 502 },
    );
  }
}

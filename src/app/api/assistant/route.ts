import { NextResponse } from "next/server";

import {
  completeWithFallback,
  configuredAssistantProviders,
} from "./assistant-providers";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 6_000;

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

  const providers = configuredAssistantProviders();
  if (providers.length === 0) {
    return NextResponse.json(
      { error: "No assistant provider has been configured." },
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

  const completion = await completeWithFallback(providers, [
    {
      role: "system",
      content:
        "You are Taskino's concise, practical AI assistant. Help users with planning, writing, analysis, and work questions. Reply in the same language as the user's latest message. Use clear formatting and never claim to have changed Taskino data.",
    },
    ...messages,
  ]);

  if (!completion) {
    return NextResponse.json(
      {
        error:
          "All free AI providers are currently unavailable or rate-limited. Please try again shortly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(completion);
}

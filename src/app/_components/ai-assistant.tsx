"use client";

import {
  Bot,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  role: "assistant" | "user";
  content: string;
};

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "سلام! من دستیار هوشمند تسکینو هستم. برای برنامه‌ریزی، نوشتن، تحلیل یا حل مسئله از من بپرس.",
};

export function AiAssistant({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || loading) return;

    const previousMessages = messages;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
      });
      const data = (await response.json()) as {
        content?: string;
        error?: string;
      };

      if (!response.ok || !data.content) {
        throw new Error(data.error || "No response was received.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.content! },
      ]);
    } catch (requestError) {
      setMessages(previousMessages);
      setDraft(content);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant is currently unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function resetConversation() {
    setMessages([WELCOME_MESSAGE]);
    setDraft("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="fixed bottom-4 left-4 z-[80] sm:bottom-6 sm:left-6" dir="rtl">
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-label="دستیار هوشمند تسکینو"
            className="mb-3 flex h-[min(620px,calc(100dvh-100px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_18px_55px_-18px_rgba(15,23,42,0.38)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_18px_55px_-18px_rgba(0,0,0,0.7)]"
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
              transition: { duration: 0.15, ease: "easeIn" },
            }}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <header className="flex items-center justify-between bg-gradient-to-l from-[#176979] to-[#2493a8] px-4 py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]">
                  <Bot size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-balance text-sm font-bold">
                    دستیار هوشمند تسکینو
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="گفتگوی جدید"
                  className="flex size-10 items-center justify-center rounded-xl text-white/75 transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white active:scale-[0.96]"
                  onClick={resetConversation}
                  type="button"
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  aria-label="بستن دستیار"
                  className="flex size-10 items-center justify-center rounded-xl text-white/75 transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white active:scale-[0.96]"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            <div
              aria-live="polite"
              className="scrollbar-hide flex-1 space-y-3 overflow-y-auto bg-[--bg] p-4"
            >
              {messages.map((message, index) => (
                <div
                  className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                  key={`${message.role}-${index}`}
                >
                  <div
                    className={`max-w-[86%] whitespace-pre-wrap text-pretty rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "rounded-bl-md bg-[#1f7a8c] text-white"
                        : "rounded-br-md bg-[--surface] text-[--text] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    }`}
                    dir="auto"
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 rounded-2xl rounded-br-md bg-[--surface] px-3.5 py-3 text-xs text-[--text-2] shadow-[0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                    <LoaderCircle className="animate-spin text-[#1f7a8c]" size={15} />
                    در حال فکر کردن...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="bg-[--surface] p-3 shadow-[0_-1px_0_rgba(15,23,42,0.06)] dark:shadow-[0_-1px_0_rgba(255,255,255,0.08)]"
              onSubmit={sendMessage}
            >
              {error && (
                <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
              <div className="flex items-end gap-2 rounded-2xl bg-[--surface-2] p-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] focus-within:shadow-[inset_0_0_0_1.5px_#1f7a8c] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <textarea
                  aria-label="پیام شما"
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-[--text] outline-none placeholder:text-[--text-3]"
                  disabled={loading}
                  maxLength={6000}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="هر چیزی می‌خواهی بپرس..."
                  ref={inputRef}
                  rows={1}
                  value={draft}
                />
                <button
                  aria-label="ارسال پیام"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1f7a8c] text-white shadow-sm transition-[background-color,scale] duration-150 ease-out hover:bg-[#176979] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!draft.trim() || loading}
                  type="submit"
                >
                  <Send className="-translate-x-px" size={17} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[--text-3]">
                پاسخ‌ها ممکن است دقیق نباشند؛ اطلاعات مهم را بررسی کنید.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        aria-expanded={open}
        aria-label={open ? "بستن دستیار هوشمند" : "باز کردن دستیار هوشمند"}
        className="mr-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2493a8] to-[#176979] text-white shadow-[0_10px_30px_-8px_rgba(31,122,140,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a8c] focus-visible:ring-offset-2 focus-visible:ring-offset-[--bg]"
        onClick={() => setOpen((value) => !value)}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        type="button"
        whileTap={{ scale: 0.96 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            key={open ? "close" : "open"}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            {open ? <X size={23} /> : <MessageCircle size={23} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

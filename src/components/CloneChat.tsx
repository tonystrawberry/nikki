"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface Props {
  locale: Locale;
  dict: Dictionary["chat"];
}

export function CloneChat({ locale, dict }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isStreaming]);

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setIsStreaming(true);

    let assistantText = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: next }),
      });

      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: assistantText }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setMessages(next);
    } finally {
      setIsStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-[70vh] rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>{dict.intro}</p>
            <ul className="list-disc pl-5 space-y-1">
              {dict.examples.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="text-left hover:text-foreground transition-colors"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
                      a: ({ children, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => (
                        <code className="rounded bg-background/60 px-1 py-0.5 text-[0.85em] font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded-lg bg-background/60 p-3 text-xs">
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h3 className="my-2 text-base font-semibold">{children}</h3>,
                      h2: ({ children }) => <h3 className="my-2 text-base font-semibold">{children}</h3>,
                      h3: ({ children }) => <h3 className="my-2 text-base font-semibold">{children}</h3>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : isStreaming ? (
                  "…"
                ) : (
                  ""
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="text-sm text-destructive">
            {dict.error}: {error}
          </div>
        )}
      </div>
      <div className="border-t border-border/50 p-3 sm:p-4 bg-background/60">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={dict.placeholder}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <Button onClick={send} disabled={isStreaming || !input.trim()}>
            {isStreaming ? dict.sending : dict.send}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{dict.disclaimer}</p>
      </div>
    </div>
  );
}

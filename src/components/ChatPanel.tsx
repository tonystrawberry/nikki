"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/chat-types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isConnected: boolean;
  dict: {
    placeholder: string;
    send: string;
    connecting: string;
    connectionError: string;
    typeMessage: string;
  };
  visitorName?: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString();
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isConnected,
  dict,
  visitorName,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    onSendMessage(text);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {!isConnected && (
        <div className="bg-accent/10 text-accent text-sm px-3 py-2 text-center border-b border-border">
          {dict.connecting}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-8">
            {dict.typeMessage}
          </p>
        )}
        {messages.map((msg) => {
          const isVisitor = msg.sender === "visitor";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                {isVisitor ? (visitorName || "You") : "Tony"} ・ {formatTime(msg.created_at)}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  isVisitor
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={dict.placeholder}
          disabled={!isConnected}
          className="flex-1 rounded-full border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {dict.send}
        </button>
      </div>
    </div>
  );
}

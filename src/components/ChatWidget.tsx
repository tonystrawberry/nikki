"use client";

import { useState, useEffect, useRef } from "react";
import ChatPanel from "./ChatPanel";
import {
  subscribeVisitorChannel,
  disconnectVisitor,
} from "@/lib/chat-client";
import type { ChatMessage, VisitorChannelData } from "@/lib/chat-types";
import type { Subscription } from "@rails/actioncable";

function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("chat_session_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("chat_session_token", token);
  }
  return token;
}

function getSavedName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("chat_visitor_name") || "";
}

function saveName(name: string): void {
  localStorage.setItem("chat_visitor_name", name);
}

interface ChatWidgetProps {
  dict: {
    chatWithMe: string;
    placeholder: string;
    send: string;
    connecting: string;
    connectionError: string;
    closeChat: string;
    typeMessage: string;
    namePlaceholder: string;
    startChat: string;
  };
}

export default function ChatWidget({ dict }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [hasName, setHasName] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [visitorName, setVisitorName] = useState<string | undefined>();
  const [hasUnread, setHasUnread] = useState(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  const tokenRef = useRef<string>("");

  useEffect(() => {
    const saved = getSavedName();
    if (saved) {
      setHasName(true);
      setNameInput(saved);
    }
  }, []);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !hasName) return;

    tokenRef.current = getSessionToken();
    if (!tokenRef.current) return;

    const sub = subscribeVisitorChannel(tokenRef.current, {
      received: (data: VisitorChannelData) => {
        switch (data.type) {
          case "history":
            setMessages(data.messages);
            setVisitorName(data.conversation.visitor_name);
            break;
          case "message":
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            if (!isOpenRef.current && data.message.sender === "admin") {
              setHasUnread(true);
            }
            break;
          case "error":
            console.error("Chat error:", data.error);
            break;
        }
      },
      connected: () => setIsConnected(true),
      disconnected: () => setIsConnected(false),
    });
    subscriptionRef.current = sub;

    return () => {
      sub.unsubscribe();
      disconnectVisitor();
      subscriptionRef.current = null;
    };
  }, [isOpen, hasName]);

  const handleSend = (content: string) => {
    subscriptionRef.current?.perform("send_message", {
      content,
      visitor_name: getSavedName(),
    });
  };

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    saveName(name);
    setHasName(true);
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    setHasUnread(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[28rem] bg-card rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-primary/30 rounded-t-2xl bg-[oklch(0.20_0.03_60)] shrink-0">
            <span className="font-semibold text-sm text-gradient">{dict.chatWithMe}</span>
            <button
              onClick={toggleOpen}
              className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors cursor-pointer"
              aria-label={dict.closeChat}
            >
              ✕
            </button>
          </div>

          {hasName ? (
            <div className="flex-1 min-h-0">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSend}
                isConnected={isConnected}
                visitorName={visitorName}
                dict={{
                  placeholder: dict.placeholder,
                  send: dict.send,
                  connecting: dict.connecting,
                  connectionError: dict.connectionError,
                  typeMessage: dict.typeMessage,
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <form onSubmit={handleStartChat} className="w-full space-y-4 text-center">
                <p className="text-sm text-muted-foreground">{dict.typeMessage}</p>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={dict.namePlaceholder}
                  maxLength={50}
                  autoFocus
                  className="w-full rounded-full border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center"
                />
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {dict.startChat}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center z-50"
        aria-label={dict.chatWithMe}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background" />
            )}
          </>
        )}
      </button>
    </>
  );
}

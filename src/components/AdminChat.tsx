"use client";

import { useState, useEffect, useRef } from "react";
import { subscribeAdminChannel, disconnectAdmin, getChatHttpUrl } from "@/lib/chat-client";
import type { ChatMessage, ChatConversation, AdminChannelData } from "@/lib/chat-types";
import type { Subscription } from "@rails/actioncable";

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const sub = subscribeAdminChannel({
      received: (data: AdminChannelData) => {
        switch (data.type) {
          case "conversations":
            setConversations(data.conversations);
            break;
          case "new_message": {
            const currentSelected = selectedIdRef.current;
            setConversations((prev) => {
              const exists = prev.some((c) => c.id === data.conversation_id);
              if (!exists) {
                subscriptionRef.current?.perform("list_conversations");
                return prev;
              }
              return prev
                .map((c) =>
                  c.id === data.conversation_id
                    ? {
                        ...c,
                        last_message: data.message.content,
                        updated_at: data.message.created_at,
                        unread_count:
                          currentSelected === c.id ? c.unread_count : c.unread_count + 1,
                      }
                    : c
                )
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                );
            });
            if (data.conversation_id === currentSelected) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }
            break;
          }
          case "history":
            if (data.conversation_id === selectedIdRef.current) {
              setMessages(data.messages);
            }
            break;
          case "conversation_deleted":
            setConversations((prev) =>
              prev.filter((c) => c.id !== data.conversation_id)
            );
            if (selectedIdRef.current === data.conversation_id) {
              setSelectedId(null);
              setMessages([]);
            }
            break;
        }
      },
      connected: () => setIsConnected(true),
      disconnected: () => setIsConnected(false),
    });
    subscriptionRef.current = sub;

    return () => {
      sub.unsubscribe();
      disconnectAdmin();
    };
  }, []);

  const selectConversation = (id: number) => {
    setSelectedId(id);
    setMessages([]);
    subscriptionRef.current?.perform("get_history", { conversation_id: id });
    subscriptionRef.current?.perform("mark_read", { conversation_id: id });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedId || !isConnected) return;
    subscriptionRef.current?.perform("send_message", {
      conversation_id: selectedId,
      content: text,
    });
    setInput("");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this conversation permanently?")) return;
    try {
      await fetch(`${getChatHttpUrl()}/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-screen">
      {/* Left panel — conversation list */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="px-4 py-3 border-b border-border shrink-0">
          <h1 className="text-lg font-bold text-gradient">Chats</h1>
          {!isConnected && (
            <span className="text-xs text-accent">Connecting...</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-8">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-border/50 hover:bg-secondary transition-colors ${
                selectedId === conv.id ? "bg-secondary border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm truncate ${
                      conv.unread_count > 0
                        ? "font-bold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {conv.visitor_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {formatRelativeTime(conv.updated_at)}
                  </span>
                </div>
                {conv.last_message && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {conv.unread_count > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {conv.unread_count}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conv.id);
                  }}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 cursor-pointer"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — messages */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="px-4 py-3 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">
                {selectedConv.visitor_name}
              </h2>
              <span className="text-xs text-muted-foreground">
                Started {new Date(selectedConv.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {isAdmin ? "You" : selectedConv.visitor_name} ·{" "}
                      {formatRelativeTime(msg.created_at)}
                    </span>
                    <div
                      className={`max-w-[60%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        isAdmin
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

            <div className="border-t border-border p-3 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a reply..."
                disabled={!isConnected}
                className="flex-1 rounded-full border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected || !input.trim()}
                className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

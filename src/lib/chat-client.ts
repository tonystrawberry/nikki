import { createConsumer, type Consumer, type Subscription } from "@rails/actioncable";
import type {
  VisitorChannelData,
  AdminChannelData,
} from "./chat-types";

const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "ws://localhost:3100/cable";
const HTTP_URL = process.env.NEXT_PUBLIC_CHAT_HTTP_URL ?? "http://localhost:3100";

let visitorConsumer: Consumer | null = null;
let adminConsumer: Consumer | null = null;

export function getVisitorConsumer(sessionToken: string): Consumer {
  if (!visitorConsumer) {
    visitorConsumer = createConsumer(`${WS_URL}?token=${sessionToken}`);
  }
  return visitorConsumer;
}

export function getAdminConsumer(): Consumer {
  if (!adminConsumer) {
    adminConsumer = createConsumer(WS_URL);
  }
  return adminConsumer;
}

export function disconnectVisitor(): void {
  visitorConsumer?.disconnect();
  visitorConsumer = null;
}

export function disconnectAdmin(): void {
  adminConsumer?.disconnect();
  adminConsumer = null;
}

export function subscribeVisitorChannel(
  sessionToken: string,
  callbacks: {
    received: (data: VisitorChannelData) => void;
    connected?: () => void;
    disconnected?: () => void;
  }
): Subscription {
  const consumer = getVisitorConsumer(sessionToken);
  return consumer.subscriptions.create("VisitorChannel", {
    received(data: VisitorChannelData) {
      callbacks.received(data);
    },
    connected() {
      callbacks.connected?.();
    },
    disconnected() {
      callbacks.disconnected?.();
    },
  });
}

export function subscribeAdminChannel(callbacks: {
  received: (data: AdminChannelData) => void;
  connected?: () => void;
  disconnected?: () => void;
}): Subscription {
  const consumer = getAdminConsumer();
  return consumer.subscriptions.create("AdminChannel", {
    received(data: AdminChannelData) {
      callbacks.received(data);
    },
    connected() {
      callbacks.connected?.();
    },
    disconnected() {
      callbacks.disconnected?.();
    },
  });
}

export async function adminLogin(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${HTTP_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function adminLogout(): Promise<void> {
  await fetch(`${HTTP_URL}/auth/logout`, {
    method: "DELETE",
    credentials: "include",
  });
  disconnectAdmin();
}

export function getChatHttpUrl(): string {
  return HTTP_URL;
}

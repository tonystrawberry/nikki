export interface ChatMessage {
  id: number;
  sender: "visitor" | "admin";
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  session_token: string;
  visitor_name: string;
  unread_count: number;
  last_message?: string;
  updated_at: string;
  created_at: string;
}

export type VisitorChannelData =
  | { type: "history"; conversation: { id: number; visitor_name: string }; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; error: string };

export type AdminChannelData =
  | { type: "conversations"; conversations: ChatConversation[] }
  | { type: "new_message"; conversation_id: number; visitor_name: string; message: ChatMessage }
  | { type: "history"; conversation_id: number; messages: ChatMessage[] }
  | { type: "conversation_deleted"; conversation_id: number }
  | { type: "error"; error: string };

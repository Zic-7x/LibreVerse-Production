import type { MobileConversation, MobileMessage } from "../entities/chat.js";

export interface SendMessageInput {
  messageType: "text" | "media";
  body?: string;
  mediaId?: string;
}

export interface ChatRepository {
  listConversations(token: string): Promise<MobileConversation[]>;
  createDirectConversation(token: string, targetUserId: string): Promise<MobileConversation>;
  getMessages(token: string, conversationId: string): Promise<MobileMessage[]>;
  sendMessage(token: string, conversationId: string, input: SendMessageInput): Promise<MobileMessage>;
  editMessage(token: string, conversationId: string, messageId: string, body: string): Promise<MobileMessage>;
  deleteMessage(token: string, conversationId: string, messageId: string): Promise<void>;
  markConversationRead(token: string, conversationId: string): Promise<void>;
  connectWebSocket(token: string, onMessage: (msg: MobileMessage) => void): () => void;
}


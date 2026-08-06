import type { MobileConversation, MobileMessage } from "../../domain/entities/chat.js";
import type { ChatRepository, SendMessageInput } from "../../domain/repositories/chat-repository.js";

export class ListConversationsUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string): Promise<MobileConversation[]> {
    if (!token) throw new Error("Token is required.");
    return this.chatRepo.listConversations(token);
  }
}

export class CreateDirectConversationUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, targetUserId: string): Promise<MobileConversation> {
    if (!token || !targetUserId) throw new Error("Token and targetUserId required.");
    return this.chatRepo.createDirectConversation(token, targetUserId);
  }
}

export class GetMessagesUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, conversationId: string): Promise<MobileMessage[]> {
    if (!token || !conversationId) throw new Error("Token and conversationId required.");
    return this.chatRepo.getMessages(token, conversationId);
  }
}

export class SendMessageUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, conversationId: string, input: SendMessageInput): Promise<MobileMessage> {
    if (!token || !conversationId) throw new Error("Token and conversationId required.");
    if (!input.body && !input.mediaId) throw new Error("Message must have text body or mediaId.");
    return this.chatRepo.sendMessage(token, conversationId, input);
  }
}

export class EditMessageUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, conversationId: string, messageId: string, body: string): Promise<MobileMessage> {
    if (!token || !conversationId || !messageId) throw new Error("Token, conversationId, and messageId required.");
    if (!body || !body.trim()) throw new Error("Body cannot be empty.");
    return this.chatRepo.editMessage(token, conversationId, messageId, body.trim());
  }
}

export class DeleteMessageUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, conversationId: string, messageId: string): Promise<void> {
    if (!token || !conversationId || !messageId) throw new Error("Token, conversationId, and messageId required.");
    return this.chatRepo.deleteMessage(token, conversationId, messageId);
  }
}

export class MarkConversationReadUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  async execute(token: string, conversationId: string): Promise<void> {
    if (!token || !conversationId) throw new Error("Token and conversationId required.");
    return this.chatRepo.markConversationRead(token, conversationId);
  }
}

export class ConnectRealtimeChatUseCase {
  constructor(private readonly chatRepo: ChatRepository) {}

  execute(token: string, onMessage: (msg: MobileMessage) => void): () => void {
    if (!token) throw new Error("Token is required.");
    return this.chatRepo.connectWebSocket(token, onMessage);
  }
}


import type {
  ConnectRealtimeChatUseCase,
  CreateDirectConversationUseCase,
  DeleteMessageUseCase,
  EditMessageUseCase,
  GetMessagesUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendMessageUseCase,
} from "../../application/use-cases/chat-use-cases.js";
import type { MobileConversation, MobileMessage } from "../../domain/entities/chat.js";

export class ChatScreen {
  constructor(
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly createDirectConversationUseCase: CreateDirectConversationUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly connectRealtimeChatUseCase: ConnectRealtimeChatUseCase,
    private readonly editMessageUseCase?: EditMessageUseCase,
    private readonly deleteMessageUseCase?: DeleteMessageUseCase,
    private readonly markConversationReadUseCase?: MarkConversationReadUseCase,
  ) {}

  async loadConversations(token: string): Promise<MobileConversation[]> {
    return this.listConversationsUseCase.execute(token);
  }

  async startDirectChat(token: string, targetUserId: string): Promise<MobileConversation> {
    return this.createDirectConversationUseCase.execute(token, targetUserId);
  }

  async loadMessages(token: string, conversationId: string): Promise<MobileMessage[]> {
    return this.getMessagesUseCase.execute(token, conversationId);
  }

  async sendTextMessage(token: string, conversationId: string, text: string): Promise<MobileMessage> {
    return this.sendMessageUseCase.execute(token, conversationId, {
      messageType: "text",
      body: text,
    });
  }

  async sendMediaMessage(token: string, conversationId: string, mediaId: string): Promise<MobileMessage> {
    return this.sendMessageUseCase.execute(token, conversationId, {
      messageType: "media",
      mediaId,
    });
  }

  async editMessage(token: string, conversationId: string, messageId: string, body: string): Promise<MobileMessage> {
    if (!this.editMessageUseCase) {
      throw new Error("EditMessageUseCase not configured on ChatScreen.");
    }
    return this.editMessageUseCase.execute(token, conversationId, messageId, body);
  }

  async deleteMessage(token: string, conversationId: string, messageId: string): Promise<void> {
    if (!this.deleteMessageUseCase) {
      throw new Error("DeleteMessageUseCase not configured on ChatScreen.");
    }
    return this.deleteMessageUseCase.execute(token, conversationId, messageId);
  }

  async markRead(token: string, conversationId: string): Promise<void> {
    if (!this.markConversationReadUseCase) {
      throw new Error("MarkConversationReadUseCase not configured on ChatScreen.");
    }
    return this.markConversationReadUseCase.execute(token, conversationId);
  }

  subscribeToLiveMessages(token: string, onNewMessage: (msg: MobileMessage) => void): () => void {
    return this.connectRealtimeChatUseCase.execute(token, onNewMessage);
  }
}


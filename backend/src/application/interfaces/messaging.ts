import type { CreateLocationInput, MessageType } from "@platform/shared-types";
import type {
  ConversationEntity,
  ConversationParticipantEntity,
  LocationEntity,
  MessageEntity,
} from "../../domain/entities/messaging-entities.js";

export interface MessagingRepository {
  findDirectConversation(
    userA: string,
    userB: string,
  ): Promise<ConversationEntity | null>;

  createDirectConversation(
    userA: string,
    userB: string,
  ): Promise<ConversationEntity>;

  findById(conversationId: string): Promise<ConversationEntity | null>;

  getParticipants(
    conversationId: string,
  ): Promise<ConversationParticipantEntity[]>;

  getParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipantEntity | null>;

  updateReadWatermark(conversationId: string, userId: string): Promise<void>;

  updateParticipantSettings(
    conversationId: string,
    userId: string,
    settings: { isMuted?: boolean },
  ): Promise<void>;

  listUserConversations(userId: string): Promise<
    {
      conversation: ConversationEntity;
      participants: ConversationParticipantEntity[];
      lastMessage: MessageEntity | null;
      unreadCount: number;
    }[]
  >;

  createMessage(input: {
    conversationId: string;
    senderUserId: string;
    messageType?: MessageType;
    body?: string | null;
    locationId?: string | null;
    replyToId?: string;
  }): Promise<MessageEntity>;

  createLocation(input: CreateLocationInput): Promise<LocationEntity>;

  attachMediaToMessage(messageId: string, mediaIds: string[]): Promise<void>;

  findMessageById(messageId: string): Promise<MessageEntity | null>;

  listMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<MessageEntity[]>;

  updateMessage(messageId: string, body: string): Promise<MessageEntity>;

  createChannelConversation(
    communityId: string,
    title: string,
    createdBy: string,
  ): Promise<ConversationEntity>;

  listCommunityChannels(communityId: string): Promise<ConversationEntity[]>;

  updateChannelConversation(
    channelId: string,
    title: string,
  ): Promise<ConversationEntity>;

  archiveChannelConversation(channelId: string): Promise<ConversationEntity>;

  softDeleteMessage(messageId: string): Promise<MessageEntity>;
}

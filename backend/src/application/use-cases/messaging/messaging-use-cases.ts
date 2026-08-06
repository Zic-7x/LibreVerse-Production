import type {
  ConversationSummary,
  Message,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { UserRepository } from "../../interfaces/auth.js";
import type { CommunityRepository } from "../../interfaces/community.js";
import type { FriendshipRepository } from "../../interfaces/friendship.js";
import type { MediaRepository } from "../../interfaces/media.js";
import type { MessagingRepository } from "../../interfaces/messaging.js";
import type { RealtimePublisher } from "../../interfaces/realtime.js";
import type { NotificationRepository } from "../../interfaces/notification.js";
import type { ModerationRepository } from "../../interfaces/moderation.js";
import {
  toSharedConversation,
  toSharedConversationParticipant,
  toSharedMessage,
} from "../../../domain/entities/messaging-entities.js";
import {
  validateEditMessageInput,
  validateSendMessageInput,
} from "../../validation/messaging-validation.js";

export class GetOrCreateDirectConversationUseCase {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly friendshipRepo: FriendshipRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string, targetUserId: string): Promise<ConversationSummary> {
    if (userId === targetUserId) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Cannot start a conversation with yourself",
      );
    }

    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new ApplicationError("NOT_FOUND", "Target user not found");
    }

    // Check interaction policy / block status
    const friendship = await this.friendshipRepo.findPair(userId, targetUserId);
    if (friendship?.status === "blocked") {
      throw new ApplicationError(
        "FORBIDDEN",
        "Cannot start a conversation with a blocked user",
      );
    }

    const conversation = await this.messagingRepo.createDirectConversation(
      userId,
      targetUserId,
    );

    const participants = await this.messagingRepo.getParticipants(conversation.id);

    return {
      conversation: toSharedConversation(conversation),
      participants: participants.map(toSharedConversationParticipant),
      lastMessage: null,
      unreadCount: 0,
    };
  }
}

export class ListConversationsUseCase {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(userId: string): Promise<ConversationSummary[]> {
    const rawSummaries = await this.messagingRepo.listUserConversations(userId);

    return rawSummaries.map((s) => ({
      conversation: toSharedConversation(s.conversation),
      participants: s.participants.map(toSharedConversationParticipant),
      lastMessage: s.lastMessage ? toSharedMessage(s.lastMessage) : null,
      unreadCount: s.unreadCount,
    }));
  }
}

export class GetConversationMessagesUseCase {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(
    userId: string,
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<Message[]> {
    const participant = await this.messagingRepo.getParticipant(
      conversationId,
      userId,
    );

    if (!participant || participant.leftAt !== null) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You are not a participant in this conversation",
      );
    }

    const messages = await this.messagingRepo.listMessages(
      conversationId,
      options,
    );

    return messages.map(toSharedMessage);
  }
}

export class SendMessageUseCase {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly friendshipRepo: FriendshipRepository,
    private readonly mediaRepo?: MediaRepository,
    private readonly realtimePublisher?: RealtimePublisher,
    private readonly notificationRepo?: NotificationRepository,
    private readonly moderationRepo?: ModerationRepository,
  ) {}

  async execute(
    userId: string,
    conversationId: string,
    input: unknown,
  ): Promise<Message> {
    if (this.moderationRepo) {
      const activeMutes = await this.moderationRepo.findActiveSanctionsForUser(
        userId,
        "mute",
      );
      if (activeMutes.length > 0) {
        throw new ApplicationError(
          "FORBIDDEN",
          "User is currently muted from sending messages",
        );
      }
    }

    const validated = validateSendMessageInput(input);

    const conversation = await this.messagingRepo.findById(conversationId);
    if (!conversation) {
      throw new ApplicationError("NOT_FOUND", "Conversation not found");
    }

    const participant = await this.messagingRepo.getParticipant(
      conversationId,
      userId,
    );

    if (!participant || participant.leftAt !== null) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You are not a participant in this conversation",
      );
    }

    if (conversation.conversationType === "direct") {
      const participants = await this.messagingRepo.getParticipants(conversationId);
      const otherPart = participants.find((p) => p.userId !== userId);
      if (otherPart) {
        const friendship = await this.friendshipRepo.findPair(
          userId,
          otherPart.userId,
        );
        if (friendship?.status === "blocked") {
          throw new ApplicationError(
            "FORBIDDEN",
            "Cannot send message due to block status",
          );
        }
      }
    }

    if (validated.replyToId) {
      const replyMsg = await this.messagingRepo.findMessageById(
        validated.replyToId,
      );
      if (!replyMsg || replyMsg.conversationId !== conversationId) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "Invalid replyToId for this conversation",
        );
      }
    }

    let createdMsg;

    if (validated.messageType === "media") {
      if (!validated.mediaIds || validated.mediaIds.length === 0) {
        throw new ApplicationError("VALIDATION_ERROR", "mediaIds is required for media messages");
      }

      if (this.mediaRepo) {
        const mediaItems = await this.mediaRepo.findManyByIds(validated.mediaIds);
        if (mediaItems.length !== validated.mediaIds.length) {
          throw new ApplicationError("VALIDATION_ERROR", "One or more attached media files do not exist");
        }
        for (const m of mediaItems) {
          if (m.uploaderUserId !== userId) {
            throw new ApplicationError("FORBIDDEN", "Cannot attach media uploaded by another user");
          }
          if (m.status !== "ready") {
            throw new ApplicationError("VALIDATION_ERROR", "Attached media must be in ready status");
          }
        }
      }

      const created = await this.messagingRepo.createMessage({
        conversationId,
        senderUserId: userId,
        messageType: "media",
        body: validated.body,
        replyToId: validated.replyToId,
      });

      await this.messagingRepo.attachMediaToMessage(created.id, validated.mediaIds);
      createdMsg = await this.messagingRepo.findMessageById(created.id);
    } else if (validated.messageType === "location") {
      if (!validated.location) {
        throw new ApplicationError("VALIDATION_ERROR", "location is required for location messages");
      }

      const loc = await this.messagingRepo.createLocation(validated.location);
      const created = await this.messagingRepo.createMessage({
        conversationId,
        senderUserId: userId,
        messageType: "location",
        body: validated.body,
        locationId: loc.id,
        replyToId: validated.replyToId,
      });

      createdMsg = await this.messagingRepo.findMessageById(created.id);
    } else {
      const created = await this.messagingRepo.createMessage({
        conversationId,
        senderUserId: userId,
        messageType: "text",
        body: validated.body,
        replyToId: validated.replyToId,
      });
      createdMsg = await this.messagingRepo.findMessageById(created.id);
    }

    if (!createdMsg) {
      throw new ApplicationError("VALIDATION_ERROR", "Failed to retrieve created message");
    }

    const sharedMessage = toSharedMessage(createdMsg);
    this.realtimePublisher?.publishMessageCreated(conversationId, sharedMessage);

    if (this.notificationRepo) {
      const participants = await this.messagingRepo.getParticipants(conversationId);
      const isDirect = conversation.conversationType === "direct";
      const notifType = isDirect ? "new_message" : "channel_message";
      const notifTitle = isDirect ? "New Message" : "New Channel Message";

      for (const p of participants) {
        if (p.userId !== userId && p.leftAt === null) {
          await this.notificationRepo.createNotification({
            recipientUserId: p.userId,
            actorUserId: userId,
            notificationType: notifType,
            title: notifTitle,
            body: validated.body || (validated.messageType === "media" ? "Sent an attachment" : "Sent a location"),
            payload: { conversationId, messageId: createdMsg.id },
          }).catch(() => {});
        }
      }
    }

    return sharedMessage;
  }
}

export const SendTextMessageUseCase = SendMessageUseCase;
export type SendTextMessageUseCase = SendMessageUseCase;

export class EditMessageUseCase {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(
    userId: string,
    messageId: string,
    input: { body: string },
  ): Promise<Message> {
    const validated = validateEditMessageInput(input);

    const message = await this.messagingRepo.findMessageById(messageId);
    if (!message) {
      throw new ApplicationError("NOT_FOUND", "Message not found");
    }

    if (message.senderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You can only edit your own messages",
      );
    }

    if (message.deletedAt !== null) {
      throw new ApplicationError(
        "CONFLICT",
        "Cannot edit a deleted message",
      );
    }

    const updated = await this.messagingRepo.updateMessage(
      messageId,
      validated.body,
    );

    const sharedMessage = toSharedMessage(updated);
    this.realtimePublisher?.publishMessageUpdated(
      message.conversationId,
      sharedMessage,
    );

    return sharedMessage;
  }
}

export class SoftDeleteMessageUseCase {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly realtimePublisher?: RealtimePublisher,
    private readonly communityRepo?: CommunityRepository,
  ) {}

  async execute(userId: string, messageId: string): Promise<Message> {
    const message = await this.messagingRepo.findMessageById(messageId);
    if (!message) {
      throw new ApplicationError("NOT_FOUND", "Message not found");
    }

    if (message.senderUserId !== userId) {
      let isModerator = false;
      if (this.communityRepo) {
        const conv = await this.messagingRepo.findById(message.conversationId);
        if (conv?.conversationType === "community_channel" && conv.communityId) {
          const member = await this.communityRepo.getMember(conv.communityId, userId);
          if (
            member &&
            member.leftAt === null &&
            ["moderator", "admin", "owner"].includes(member.role)
          ) {
            isModerator = true;
          }
        }
      }

      if (!isModerator) {
        throw new ApplicationError(
          "FORBIDDEN",
          "You can only delete your own messages",
        );
      }
    }

    if (message.deletedAt !== null) {
      return toSharedMessage(message);
    }

    const deleted = await this.messagingRepo.softDeleteMessage(messageId);
    const sharedMessage = toSharedMessage(deleted);
    this.realtimePublisher?.publishMessageDeleted(
      message.conversationId,
      sharedMessage,
    );

    return sharedMessage;
  }
}

export class MarkConversationReadUseCase {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(userId: string, conversationId: string): Promise<void> {
    const participant = await this.messagingRepo.getParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You are not a participant in this conversation",
      );
    }

    await this.messagingRepo.updateReadWatermark(conversationId, userId);
  }
}

export class UpdateParticipantSettingsUseCase {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(
    userId: string,
    conversationId: string,
    settings: { isMuted?: boolean },
  ): Promise<void> {
    const participant = await this.messagingRepo.getParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You are not a participant in this conversation",
      );
    }

    await this.messagingRepo.updateParticipantSettings(
      conversationId,
      userId,
      settings,
    );
  }
}

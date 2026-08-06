import type { Conversation } from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { CommunityRepository } from "../../interfaces/community.js";
import type { MessagingRepository } from "../../interfaces/messaging.js";
import { toSharedConversation } from "../../../domain/entities/messaging-entities.js";
import {
  validateCreateChannelInput,
  validateUpdateChannelInput,
} from "../../validation/channel-validation.js";

export class CreateChannelUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly messagingRepo: MessagingRepository,
  ) {}

  async execute(
    communityId: string,
    userId: string,
    input: unknown,
  ): Promise<Conversation> {
    const validated = validateCreateChannelInput(input);

    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt !== null) {
      throw new ApplicationError("FORBIDDEN", "Cannot modify an archived community");
    }

    const member = await this.communityRepo.getMember(communityId, userId);
    if (
      !member ||
      member.leftAt !== null ||
      !["admin", "owner"].includes(member.role)
    ) {
      throw new ApplicationError(
        "FORBIDDEN",
        "Only community admins or owners can create channels",
      );
    }

    const channel = await this.messagingRepo.createChannelConversation(
      communityId,
      validated.title,
      userId,
    );

    return toSharedConversation(channel);
  }
}

export class ListChannelsUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly messagingRepo: MessagingRepository,
  ) {}

  async execute(
    communityId: string,
    requestingUserId?: string,
  ): Promise<Conversation[]> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    let member = null;
    if (requestingUserId) {
      member = await this.communityRepo.getMember(communityId, requestingUserId);
    }

    if (community.visibility === "hidden") {
      if (!member || member.leftAt !== null) {
        throw new ApplicationError("NOT_FOUND", "Community not found");
      }
    } else if (community.visibility === "private") {
      if (!member || member.leftAt !== null) {
        throw new ApplicationError("FORBIDDEN", "Access denied to private community channels");
      }
    }

    const channels = await this.messagingRepo.listCommunityChannels(communityId);
    return channels.map(toSharedConversation);
  }
}

export class UpdateChannelUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly messagingRepo: MessagingRepository,
  ) {}

  async execute(
    communityId: string,
    channelId: string,
    userId: string,
    input: unknown,
  ): Promise<Conversation> {
    const validated = validateUpdateChannelInput(input);

    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt !== null) {
      throw new ApplicationError("FORBIDDEN", "Cannot modify an archived community");
    }

    const member = await this.communityRepo.getMember(communityId, userId);
    if (
      !member ||
      member.leftAt !== null ||
      !["admin", "owner"].includes(member.role)
    ) {
      throw new ApplicationError(
        "FORBIDDEN",
        "Only community admins or owners can update channels",
      );
    }

    const channel = await this.messagingRepo.findById(channelId);
    if (!channel || channel.communityId !== communityId) {
      throw new ApplicationError("NOT_FOUND", "Channel not found");
    }

    const updated = await this.messagingRepo.updateChannelConversation(
      channelId,
      validated.title,
    );

    return toSharedConversation(updated);
  }
}

export class ArchiveChannelUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly messagingRepo: MessagingRepository,
  ) {}

  async execute(
    communityId: string,
    channelId: string,
    userId: string,
  ): Promise<Conversation> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt !== null) {
      throw new ApplicationError("FORBIDDEN", "Cannot modify an archived community");
    }

    const member = await this.communityRepo.getMember(communityId, userId);
    if (
      !member ||
      member.leftAt !== null ||
      !["admin", "owner"].includes(member.role)
    ) {
      throw new ApplicationError(
        "FORBIDDEN",
        "Only community admins or owners can archive channels",
      );
    }

    const channel = await this.messagingRepo.findById(channelId);
    if (!channel || channel.communityId !== communityId) {
      throw new ApplicationError("NOT_FOUND", "Channel not found");
    }

    const archived = await this.messagingRepo.archiveChannelConversation(channelId);
    return toSharedConversation(archived);
  }
}

import type {
  Community,
  CommunityMember,
  CommunityMemberRole,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { CommunityRepository } from "../../interfaces/community.js";
import type { MediaRepository } from "../../interfaces/media.js";
import type { MessagingRepository } from "../../interfaces/messaging.js";
import {
  toSharedCommunity,
  toSharedCommunityMember,
} from "../../../domain/entities/community-entities.js";
import {
  validateAddMemberInput,
  validateCreateCommunityInput,
  validateTransferOwnershipInput,
  validateUpdateCommunityInput,
  validateUpdateMemberRoleInput,
} from "../../validation/community-validation.js";

export class CreateCommunityUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly mediaRepo?: MediaRepository,
    private readonly messagingRepo?: MessagingRepository,
  ) {}

  async execute(ownerUserId: string, input: unknown): Promise<Community> {
    const validated = validateCreateCommunityInput(input);

    const existingSlug = await this.communityRepo.findBySlug(validated.slug);
    if (existingSlug) {
      throw new ApplicationError("CONFLICT", "Community slug is already in use");
    }

    if (validated.avatarMediaId && this.mediaRepo) {
      const media = await this.mediaRepo.findById(validated.avatarMediaId);
      if (!media || media.status !== "ready") {
        throw new ApplicationError("VALIDATION_ERROR", "avatarMediaId must refer to a ready media item");
      }
    }

    const created = await this.communityRepo.create({
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      avatarMediaId: validated.avatarMediaId,
      ownerUserId,
      visibility: validated.visibility ?? "public",
    });

    if (this.messagingRepo) {
      await this.messagingRepo.createChannelConversation(created.id, "general", ownerUserId);
    }

    return toSharedCommunity(created, "owner");
  }
}

export class GetCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(identifier: string, requestingUserId?: string): Promise<Community> {
    const community = identifier.includes("-") && identifier.length === 36
      ? (await this.communityRepo.findById(identifier)) ?? (await this.communityRepo.findBySlug(identifier))
      : await this.communityRepo.findBySlug(identifier);

    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    let memberRole: CommunityMemberRole | null = null;
    if (requestingUserId) {
      const member = await this.communityRepo.getMember(community.id, requestingUserId);
      if (member) {
        memberRole = member.role;
      }
    }

    if (community.visibility === "hidden" && !memberRole) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    return toSharedCommunity(community, memberRole);
  }
}

export class ListPublicCommunitiesUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(requestingUserId?: string): Promise<Community[]> {
    const communities = await this.communityRepo.listPublicCommunities();

    const results: Community[] = [];
    for (const c of communities) {
      let role: CommunityMemberRole | null = null;
      if (requestingUserId) {
        const m = await this.communityRepo.getMember(c.id, requestingUserId);
        if (m) role = m.role;
      }
      results.push(toSharedCommunity(c, role));
    }

    return results;
  }
}

export class ListUserCommunitiesUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(userId: string): Promise<Community[]> {
    const communities = await this.communityRepo.listCommunitiesForUser(userId);

    const results: Community[] = [];
    for (const c of communities) {
      const m = await this.communityRepo.getMember(c.id, userId);
      results.push(toSharedCommunity(c, m?.role ?? null));
    }

    return results;
  }
}

export class UpdateCommunityUseCase {
  constructor(
    private readonly communityRepo: CommunityRepository,
    private readonly mediaRepo?: MediaRepository,
  ) {}

  async execute(communityId: string, requestingUserId: string, input: unknown): Promise<Community> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    const member = await this.communityRepo.getMember(communityId, requestingUserId);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ApplicationError("FORBIDDEN", "Only community owners and admins can update settings");
    }

    const validated = validateUpdateCommunityInput(input);

    if (validated.slug && validated.slug !== community.slug) {
      const existingSlug = await this.communityRepo.findBySlug(validated.slug);
      if (existingSlug && existingSlug.id !== communityId) {
        throw new ApplicationError("CONFLICT", "Community slug is already in use");
      }
    }

    if (validated.avatarMediaId && this.mediaRepo) {
      const media = await this.mediaRepo.findById(validated.avatarMediaId);
      if (!media || media.status !== "ready") {
        throw new ApplicationError("VALIDATION_ERROR", "avatarMediaId must refer to a ready media item");
      }
    }

    const updated = await this.communityRepo.update(communityId, validated);
    return toSharedCommunity(updated, member.role);
  }
}

export class ArchiveCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, requestingUserId: string): Promise<Community> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.ownerUserId !== requestingUserId) {
      throw new ApplicationError("FORBIDDEN", "Only the community owner can archive the community");
    }

    if (community.archivedAt) {
      return toSharedCommunity(community, "owner");
    }

    const archived = await this.communityRepo.archive(communityId);
    return toSharedCommunity(archived, "owner");
  }
}

export class JoinCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, userId: string): Promise<CommunityMember> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and cannot be joined");
    }

    if (community.visibility !== "public") {
      throw new ApplicationError("FORBIDDEN", "Cannot join private or hidden community directly");
    }

    const existingMember = await this.communityRepo.getMember(communityId, userId);
    if (existingMember) {
      return toSharedCommunityMember(existingMember);
    }

    const newMember = await this.communityRepo.addMember(communityId, userId, "member");
    return toSharedCommunityMember(newMember);
  }
}

export class LeaveCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, userId: string): Promise<void> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    const member = await this.communityRepo.getMember(communityId, userId);
    if (!member) {
      throw new ApplicationError("VALIDATION_ERROR", "User is not a member of this community");
    }

    if (member.role === "owner") {
      throw new ApplicationError("FORBIDDEN", "Owner must transfer ownership before leaving the community");
    }

    await this.communityRepo.removeMember(communityId, userId);
  }
}

export class AddOrInviteMemberUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, requestingUserId: string, input: unknown): Promise<CommunityMember> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    const requester = await this.communityRepo.getMember(communityId, requestingUserId);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new ApplicationError("FORBIDDEN", "Only owners and admins can invite/add members");
    }

    const validated = validateAddMemberInput(input);
    const targetRole = validated.role ?? "member";

    if (targetRole === "admin" && requester.role !== "owner") {
      throw new ApplicationError("FORBIDDEN", "Only owner can add an admin");
    }

    const added = await this.communityRepo.addMember(communityId, validated.userId, targetRole);
    return toSharedCommunityMember(added);
  }
}

export class UpdateMemberRoleUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(
    communityId: string,
    targetUserId: string,
    requestingUserId: string,
    input: unknown,
  ): Promise<CommunityMember> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    const requester = await this.communityRepo.getMember(communityId, requestingUserId);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new ApplicationError("FORBIDDEN", "Only owners and admins can manage roles");
    }

    const target = await this.communityRepo.getMember(communityId, targetUserId);
    if (!target) {
      throw new ApplicationError("NOT_FOUND", "Target user is not a member of this community");
    }

    if (target.role === "owner") {
      throw new ApplicationError("FORBIDDEN", "Cannot change role of community owner");
    }

    if (requester.role === "admin" && target.role === "admin") {
      throw new ApplicationError("FORBIDDEN", "Admins cannot change role of other admins");
    }

    const validated = validateUpdateMemberRoleInput(input);

    if (validated.role === "owner") {
      throw new ApplicationError("VALIDATION_ERROR", "Use transfer ownership to set a new owner");
    }

    if (validated.role === "admin" && requester.role !== "owner") {
      throw new ApplicationError("FORBIDDEN", "Only owner can promote members to admin");
    }

    const updated = await this.communityRepo.updateMemberRole(communityId, targetUserId, validated.role);
    return toSharedCommunityMember(updated);
  }
}

export class RemoveMemberUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, targetUserId: string, requestingUserId: string): Promise<void> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    const requester = await this.communityRepo.getMember(communityId, requestingUserId);
    if (!requester) {
      throw new ApplicationError("FORBIDDEN", "Requesting user is not a member");
    }

    const target = await this.communityRepo.getMember(communityId, targetUserId);
    if (!target) {
      throw new ApplicationError("NOT_FOUND", "Target user is not a member");
    }

    if (target.role === "owner") {
      throw new ApplicationError("FORBIDDEN", "Owner cannot be removed");
    }

    if (requester.role === "admin" && target.role === "admin") {
      throw new ApplicationError("FORBIDDEN", "Admins cannot remove other admins");
    }

    if (requester.role === "moderator" && target.role !== "member") {
      throw new ApplicationError("FORBIDDEN", "Moderators can only remove regular members");
    }

    if (requester.role === "member") {
      throw new ApplicationError("FORBIDDEN", "Members cannot remove other members");
    }

    await this.communityRepo.removeMember(communityId, targetUserId);
  }
}

export class TransferOwnershipUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, requestingUserId: string, input: unknown): Promise<Community> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.archivedAt) {
      throw new ApplicationError("FORBIDDEN", "Community is archived and read-only");
    }

    if (community.ownerUserId !== requestingUserId) {
      throw new ApplicationError("FORBIDDEN", "Only the community owner can transfer ownership");
    }

    const validated = validateTransferOwnershipInput(input);
    if (validated.newOwnerUserId === requestingUserId) {
      return toSharedCommunity(community, "owner");
    }

    const updated = await this.communityRepo.transferOwnership(communityId, validated.newOwnerUserId);
    return toSharedCommunity(updated, "admin");
  }
}

export class ListCommunityMembersUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(communityId: string, requestingUserId?: string): Promise<CommunityMember[]> {
    const community = await this.communityRepo.findById(communityId);
    if (!community) {
      throw new ApplicationError("NOT_FOUND", "Community not found");
    }

    if (community.visibility === "hidden") {
      if (!requestingUserId) {
        throw new ApplicationError("NOT_FOUND", "Community not found");
      }
      const member = await this.communityRepo.getMember(communityId, requestingUserId);
      if (!member) {
        throw new ApplicationError("NOT_FOUND", "Community not found");
      }
    }

    const members = await this.communityRepo.listMembers(communityId);
    return members.map(toSharedCommunityMember);
  }
}

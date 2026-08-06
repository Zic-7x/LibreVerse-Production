import type { CreateCommunityInput } from "@platform/shared-types";
import type { MobileChannel, MobileCommunity } from "../../domain/entities/community.js";
import type { CommunityRepository } from "../../domain/repositories/community-repository.js";

export class ListPublicCommunitiesUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string): Promise<MobileCommunity[]> {
    if (!token) throw new Error("Token is required.");
    return this.communityRepo.listPublicCommunities(token);
  }
}

export class ListUserCommunitiesUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string): Promise<MobileCommunity[]> {
    if (!token) throw new Error("Token is required.");
    return this.communityRepo.listUserCommunities(token);
  }
}

export class CreateCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string, input: CreateCommunityInput): Promise<MobileCommunity> {
    if (!token) throw new Error("Token is required.");
    if (!input.name || !input.slug) throw new Error("Community name and slug are required.");
    return this.communityRepo.createCommunity(token, input);
  }
}

export class JoinCommunityUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string, communityId: string): Promise<MobileCommunity> {
    if (!token || !communityId) throw new Error("Token and communityId are required.");
    return this.communityRepo.joinCommunity(token, communityId);
  }
}

export class ListChannelsUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string, communityId: string): Promise<MobileChannel[]> {
    if (!token || !communityId) throw new Error("Token and communityId are required.");
    return this.communityRepo.listChannels(token, communityId);
  }
}

export class CreateChannelUseCase {
  constructor(private readonly communityRepo: CommunityRepository) {}

  async execute(token: string, communityId: string, title: string): Promise<MobileChannel> {
    if (!token || !communityId || !title) throw new Error("Token, communityId, and channel title are required.");
    return this.communityRepo.createChannel(token, communityId, title);
  }
}

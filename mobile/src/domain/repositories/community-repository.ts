import type { CreateCommunityInput } from "@platform/shared-types";
import type { MobileChannel, MobileCommunity } from "../entities/community.js";

export interface CommunityRepository {
  listPublicCommunities(token: string): Promise<MobileCommunity[]>;
  listUserCommunities(token: string): Promise<MobileCommunity[]>;
  createCommunity(token: string, input: CreateCommunityInput): Promise<MobileCommunity>;
  joinCommunity(token: string, communityId: string): Promise<MobileCommunity>;
  listChannels(token: string, communityId: string): Promise<MobileChannel[]>;
  createChannel(token: string, communityId: string, title: string): Promise<MobileChannel>;
}

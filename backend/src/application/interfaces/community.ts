import type { CommunityMemberRole, CommunityVisibility } from "@platform/shared-types";
import type {
  CommunityEntity,
  CommunityMemberEntity,
} from "../../domain/entities/community-entities.js";

export interface CreateCommunityRepositoryInput {
  name: string;
  slug: string;
  description?: string | null;
  avatarMediaId?: string | null;
  ownerUserId: string;
  visibility: CommunityVisibility;
}

export interface UpdateCommunityRepositoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  avatarMediaId?: string | null;
  visibility?: CommunityVisibility;
}

export interface CommunityRepository {
  create(input: CreateCommunityRepositoryInput): Promise<CommunityEntity>;
  findById(id: string): Promise<CommunityEntity | null>;
  findBySlug(slug: string): Promise<CommunityEntity | null>;
  update(id: string, input: UpdateCommunityRepositoryInput): Promise<CommunityEntity>;
  archive(id: string): Promise<CommunityEntity>;
  transferOwnership(id: string, newOwnerUserId: string): Promise<CommunityEntity>;
  listPublicCommunities(options?: { limit?: number; offset?: number }): Promise<CommunityEntity[]>;
  listCommunitiesForUser(userId: string): Promise<CommunityEntity[]>;
  getMember(communityId: string, userId: string): Promise<CommunityMemberEntity | null>;
  listMembers(communityId: string): Promise<CommunityMemberEntity[]>;
  addMember(
    communityId: string,
    userId: string,
    role?: CommunityMemberRole,
  ): Promise<CommunityMemberEntity>;
  updateMemberRole(
    communityId: string,
    userId: string,
    role: CommunityMemberRole,
  ): Promise<CommunityMemberEntity>;
  removeMember(communityId: string, userId: string): Promise<void>;
  getMemberCount(communityId: string): Promise<number>;
}

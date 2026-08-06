import type {
  Community as SharedCommunity,
  CommunityMember as SharedCommunityMember,
  CommunityMemberRole,
  CommunityVisibility,
} from "@platform/shared-types";

export interface CommunityEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarMediaId: string | null;
  ownerUserId: string;
  visibility: CommunityVisibility;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  memberCount?: number;
}

export interface CommunityMemberEntity {
  communityId: string;
  userId: string;
  role: CommunityMemberRole;
  joinedAt: Date;
  leftAt: Date | null;
  displayName?: string | null;
  avatarMediaId?: string | null;
}

export function toSharedCommunity(
  community: CommunityEntity,
  currentUserRole?: CommunityMemberRole | null,
): SharedCommunity {
  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    avatarMediaId: community.avatarMediaId,
    ownerUserId: community.ownerUserId,
    visibility: community.visibility,
    createdAt: community.createdAt.toISOString(),
    updatedAt: community.updatedAt.toISOString(),
    archivedAt: community.archivedAt ? community.archivedAt.toISOString() : null,
    memberCount: community.memberCount,
    currentUserRole: currentUserRole ?? null,
  };
}

export function toSharedCommunityMember(
  member: CommunityMemberEntity,
): SharedCommunityMember {
  return {
    communityId: member.communityId,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    leftAt: member.leftAt ? member.leftAt.toISOString() : null,
    profile: member.displayName
      ? {
          displayName: member.displayName,
          avatarMediaId: member.avatarMediaId ?? null,
        }
      : undefined,
  };
}

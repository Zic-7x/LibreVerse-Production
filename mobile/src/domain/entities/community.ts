import type { CommunityMemberRole, CommunityVisibility } from "@platform/shared-types";

export interface MobileCommunity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarMediaId: string | null;
  ownerUserId: string;
  visibility: CommunityVisibility;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  currentUserRole?: CommunityMemberRole | null;
}

export interface MobileCommunityMember {
  communityId: string;
  userId: string;
  role: CommunityMemberRole;
  joinedAt: string;
  displayName?: string;
  avatarMediaId?: string | null;
}

export interface MobileChannel {
  id: string;
  communityId: string | null;
  title: string;
  createdAt: string;
}

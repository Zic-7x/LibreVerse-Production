import type { ProfileEntity, PublicAliasEntity } from "../../domain/entities/profile-entities.js";

export interface CreateProfileInput {
  userId: string;
  displayName: string;
  bio?: string | null;
  birthDate?: string | null;
  locale?: string;
  timezone?: string;
  isDiscoverable?: boolean;
}

export interface UpdateProfileInputData {
  displayName?: string;
  bio?: string | null;
  avatarMediaId?: string | null;
  birthDate?: string | null;
  locale?: string;
  timezone?: string;
  isDiscoverable?: boolean;
}

export interface ProfileSearchResult {
  userId: string;
  displayName: string;
  alias: string | null;
  avatarMediaId: string | null;
}

export interface ProfileRepository {
  create(input: CreateProfileInput): Promise<ProfileEntity>;
  findByUserId(userId: string): Promise<ProfileEntity | null>;
  update(userId: string, data: UpdateProfileInputData): Promise<ProfileEntity>;
  searchProfiles(query: string, excludeUserId: string, limit?: number): Promise<ProfileSearchResult[]>;
}

export interface PublicAliasRepository {
  claimPrimaryAlias(userId: string, alias: string): Promise<PublicAliasEntity>;
  findPrimaryByUserId(userId: string): Promise<PublicAliasEntity | null>;
  findActiveByAlias(alias: string): Promise<PublicAliasEntity | null>;
  findHistoryByUserId(userId: string): Promise<PublicAliasEntity[]>;
}

import type { Profile as SharedProfile, PublicAlias as SharedPublicAlias } from "@platform/shared-types";

export interface ProfileEntity {
  userId: string;
  displayName: string;
  bio: string | null;
  avatarMediaId: string | null;
  birthDate: string | null;
  locale: string;
  timezone: string;
  isDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicAliasEntity {
  id: string;
  userId: string;
  alias: string;
  isPrimary: boolean;
  activeFrom: Date;
  activeUntil: Date | null;
  createdAt: Date;
}

export function toSharedProfile(profile: ProfileEntity): SharedProfile {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarMediaId: profile.avatarMediaId,
    birthDate: profile.birthDate,
    locale: profile.locale,
    timezone: profile.timezone,
    isDiscoverable: profile.isDiscoverable,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toSharedPublicAlias(alias: PublicAliasEntity): SharedPublicAlias {
  return {
    id: alias.id,
    userId: alias.userId,
    alias: alias.alias,
    isPrimary: alias.isPrimary,
    activeFrom: alias.activeFrom.toISOString(),
    activeUntil: alias.activeUntil ? alias.activeUntil.toISOString() : null,
    createdAt: alias.createdAt.toISOString(),
  };
}

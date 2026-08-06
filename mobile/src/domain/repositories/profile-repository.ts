import type { MobileProfile } from "../entities/profile.js";

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarMediaId?: string;
  locale?: string;
  timezone?: string;
}

export interface ProfileRepository {
  getProfile(token: string, userId: string): Promise<MobileProfile>;
  updateProfile(token: string, input: UpdateProfileInput): Promise<MobileProfile>;
  claimAlias(token: string, alias: string): Promise<{ alias: string }>;
  getProfileByAlias(token: string, alias: string): Promise<MobileProfile>;
}

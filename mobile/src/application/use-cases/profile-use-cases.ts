import type { MobileProfile } from "../../domain/entities/profile.js";
import type { ProfileRepository, UpdateProfileInput } from "../../domain/repositories/profile-repository.js";

export class GetProfileUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(token: string, userId: string): Promise<MobileProfile> {
    if (!token || !userId) {
      throw new Error("Token and UserId are required.");
    }
    return this.profileRepo.getProfile(token, userId);
  }
}

export class UpdateProfileUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(token: string, input: UpdateProfileInput): Promise<MobileProfile> {
    if (!token) {
      throw new Error("Token is required.");
    }
    return this.profileRepo.updateProfile(token, input);
  }
}

export class ClaimAliasUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(token: string, alias: string): Promise<{ alias: string }> {
    if (!token || !alias.trim()) {
      throw new Error("Token and valid alias are required.");
    }
    return this.profileRepo.claimAlias(token, alias.trim());
  }
}

export class GetProfileByAliasUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(token: string, alias: string): Promise<MobileProfile> {
    const cleanAlias = alias.trim().replace(/^@/, "");
    if (!token || !cleanAlias) {
      throw new Error("Token and valid alias are required.");
    }
    return this.profileRepo.getProfileByAlias(token, cleanAlias);
  }
}

import type {
  ProfileResponse,
  PublicAlias,
  UpdateProfileInput,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { UserRepository } from "../../interfaces/auth.js";
import type {
  ProfileRepository,
  PublicAliasRepository,
} from "../../interfaces/profile.js";
import {
  toSharedProfile,
  toSharedPublicAlias,
} from "../../../domain/entities/profile-entities.js";
import {
  validateAliasInput,
  validateUpdateProfileInput,
} from "../../validation/profile-validation.js";

export class GetProfileByUserIdUseCase {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly aliases: PublicAliasRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ApplicationError("NOT_FOUND", "User not found");
    }

    let profile = await this.profiles.findByUserId(userId);
    if (!profile) {
      let defaultDisplayName = "User";
      if (user.email) {
        defaultDisplayName = user.email.split("@")[0] || "User";
      } else if (user.phoneE164) {
        defaultDisplayName = `User ${user.phoneE164.slice(-4)}`;
      }

      profile = await this.profiles.create({
        userId,
        displayName: defaultDisplayName,
      });
    }

    const primaryAlias = await this.aliases.findPrimaryByUserId(userId);

    return {
      profile: toSharedProfile(profile),
      primaryAlias: primaryAlias ? toSharedPublicAlias(primaryAlias) : null,
    };
  }
}

export class GetProfileByAliasUseCase {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly aliases: PublicAliasRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(rawAlias: string): Promise<ProfileResponse> {
    const alias = validateAliasInput(rawAlias);
    const activeAlias = await this.aliases.findActiveByAlias(alias);

    if (!activeAlias) {
      throw new ApplicationError("NOT_FOUND", "Profile not found for alias");
    }

    const getByUserId = new GetProfileByUserIdUseCase(
      this.profiles,
      this.aliases,
      this.users,
    );
    return getByUserId.execute(activeAlias.userId);
  }
}

export class UpdateProfileUseCase {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly aliases: PublicAliasRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    const validated = validateUpdateProfileInput(input);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ApplicationError("NOT_FOUND", "User not found");
    }

    // Ensure profile exists first
    const existingProfile = await this.profiles.findByUserId(userId);
    if (!existingProfile) {
      const getByUserId = new GetProfileByUserIdUseCase(
        this.profiles,
        this.aliases,
        this.users,
      );
      await getByUserId.execute(userId);
    }

    const updatedProfile = await this.profiles.update(userId, validated);
    const primaryAlias = await this.aliases.findPrimaryByUserId(userId);

    return {
      profile: toSharedProfile(updatedProfile),
      primaryAlias: primaryAlias ? toSharedPublicAlias(primaryAlias) : null,
    };
  }
}

export class ClaimAliasUseCase {
  constructor(
    private readonly aliases: PublicAliasRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string, rawAlias: string): Promise<PublicAlias> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ApplicationError("NOT_FOUND", "User not found");
    }

    const alias = validateAliasInput(rawAlias);
    const claimed = await this.aliases.claimPrimaryAlias(userId, alias);
    return toSharedPublicAlias(claimed);
  }
}

export class GetAliasHistoryUseCase {
  constructor(
    private readonly aliases: PublicAliasRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string): Promise<PublicAlias[]> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ApplicationError("NOT_FOUND", "User not found");
    }

    const history = await this.aliases.findHistoryByUserId(userId);
    return history.map(toSharedPublicAlias);
  }
}

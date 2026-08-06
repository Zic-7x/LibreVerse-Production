import type {
  ClaimAliasUseCase,
  GetProfileByAliasUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
} from "../../application/use-cases/profile-use-cases.js";
import type { MobileProfile } from "../../domain/entities/profile.js";
import type { UpdateProfileInput } from "../../domain/repositories/profile-repository.js";

export class ProfileScreen {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly claimAliasUseCase: ClaimAliasUseCase,
    private readonly getProfileByAliasUseCase?: GetProfileByAliasUseCase,
  ) {}

  async loadProfile(token: string, userId: string): Promise<MobileProfile> {
    return this.getProfileUseCase.execute(token, userId);
  }

  async updateProfile(token: string, input: UpdateProfileInput): Promise<MobileProfile> {
    return this.updateProfileUseCase.execute(token, input);
  }

  async updateBioAndName(token: string, displayName?: string, bio?: string): Promise<MobileProfile> {
    return this.updateProfileUseCase.execute(token, { displayName, bio });
  }

  async setAvatar(token: string, avatarMediaId: string): Promise<MobileProfile> {
    return this.updateProfileUseCase.execute(token, { avatarMediaId });
  }

  async setPublicAlias(token: string, alias: string): Promise<{ alias: string }> {
    return this.claimAliasUseCase.execute(token, alias);
  }

  async getPublicProfileByAlias(token: string, alias: string): Promise<MobileProfile> {
    if (!this.getProfileByAliasUseCase) {
      throw new Error("GetProfileByAliasUseCase not configured on ProfileScreen.");
    }
    return this.getProfileByAliasUseCase.execute(token, alias);
  }
}

import type { CreateCommunityInput } from "@platform/shared-types";
import type {
  CreateChannelUseCase,
  CreateCommunityUseCase,
  JoinCommunityUseCase,
  ListChannelsUseCase,
  ListPublicCommunitiesUseCase,
  ListUserCommunitiesUseCase,
} from "../../application/use-cases/community-use-cases.js";
import type { MobileChannel, MobileCommunity } from "../../domain/entities/community.js";

export class CommunitiesScreen {
  constructor(
    private readonly listPublicUseCase: ListPublicCommunitiesUseCase,
    private readonly listUserUseCase: ListUserCommunitiesUseCase,
    private readonly createCommunityUseCase: CreateCommunityUseCase,
    private readonly joinCommunityUseCase: JoinCommunityUseCase,
    private readonly listChannelsUseCase: ListChannelsUseCase,
    private readonly createChannelUseCase: CreateChannelUseCase,
  ) {}

  async loadDiscoverFeed(token: string): Promise<MobileCommunity[]> {
    return this.listPublicUseCase.execute(token);
  }

  async loadJoinedCommunities(token: string): Promise<MobileCommunity[]> {
    return this.listUserUseCase.execute(token);
  }

  async createNewCommunity(token: string, input: CreateCommunityInput): Promise<MobileCommunity> {
    return this.createCommunityUseCase.execute(token, input);
  }

  async join(token: string, communityId: string): Promise<MobileCommunity> {
    return this.joinCommunityUseCase.execute(token, communityId);
  }

  async loadCommunityChannels(token: string, communityId: string): Promise<MobileChannel[]> {
    return this.listChannelsUseCase.execute(token, communityId);
  }

  async addChannel(token: string, communityId: string, title: string): Promise<MobileChannel> {
    return this.createChannelUseCase.execute(token, communityId, title);
  }
}

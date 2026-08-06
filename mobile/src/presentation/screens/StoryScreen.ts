import type { CreateStoryInput } from "@platform/shared-types";
import type {
  CreateStoryUseCase,
  GetStoryFeedUseCase,
  GetStoryViewersUseCase,
  RecordStoryViewUseCase,
} from "../../application/use-cases/story-use-cases.js";
import type { MobileStory, MobileStoryViewRecord } from "../../domain/entities/story.js";

export class StoryScreen {
  constructor(
    private readonly getStoryFeedUseCase: GetStoryFeedUseCase,
    private readonly createStoryUseCase: CreateStoryUseCase,
    private readonly recordStoryViewUseCase: RecordStoryViewUseCase,
    private readonly getStoryViewersUseCase: GetStoryViewersUseCase,
  ) {}

  async loadFeed(token: string): Promise<MobileStory[]> {
    return this.getStoryFeedUseCase.execute(token);
  }

  async publishStory(token: string, input: CreateStoryInput): Promise<MobileStory> {
    return this.createStoryUseCase.execute(token, input);
  }

  async viewStory(token: string, storyId: string): Promise<{ success: boolean; viewedAt: string }> {
    return this.recordStoryViewUseCase.execute(token, storyId);
  }

  async loadViewers(token: string, storyId: string): Promise<MobileStoryViewRecord[]> {
    return this.getStoryViewersUseCase.execute(token, storyId);
  }
}

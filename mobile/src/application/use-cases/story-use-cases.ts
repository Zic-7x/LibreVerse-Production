import type { CreateStoryInput } from "@platform/shared-types";
import type { MobileStory, MobileStoryViewRecord } from "../../domain/entities/story.js";
import type { StoryRepository } from "../../domain/repositories/story-repository.js";

export class GetStoryFeedUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(token: string): Promise<MobileStory[]> {
    if (!token) throw new Error("Token is required.");
    return this.storyRepo.getFeed(token);
  }
}

export class CreateStoryUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(token: string, input: CreateStoryInput): Promise<MobileStory> {
    if (!token) throw new Error("Token is required.");
    if (!input.items || input.items.length === 0) {
      throw new Error("Story must have at least one media item.");
    }
    return this.storyRepo.createStory(token, input);
  }
}

export class RecordStoryViewUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(token: string, storyId: string): Promise<{ success: boolean; viewedAt: string }> {
    if (!token || !storyId) throw new Error("Token and storyId are required.");
    return this.storyRepo.recordView(token, storyId);
  }
}

export class GetStoryViewersUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(token: string, storyId: string): Promise<MobileStoryViewRecord[]> {
    if (!token || !storyId) throw new Error("Token and storyId are required.");
    return this.storyRepo.getViewers(token, storyId);
  }
}

import type { CreateStoryInput } from "@platform/shared-types";
import type { MobileStory, MobileStoryViewRecord } from "../entities/story.js";

export interface StoryRepository {
  getFeed(token: string): Promise<MobileStory[]>;
  createStory(token: string, input: CreateStoryInput): Promise<MobileStory>;
  recordView(token: string, storyId: string): Promise<{ success: boolean; viewedAt: string }>;
  getViewers(token: string, storyId: string): Promise<MobileStoryViewRecord[]>;
}

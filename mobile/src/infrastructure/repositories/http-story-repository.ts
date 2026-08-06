import type { CreateStoryInput } from "@platform/shared-types";
import type { MobileStory, MobileStoryViewRecord } from "../../domain/entities/story.js";
import type { StoryRepository } from "../../domain/repositories/story-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpStoryRepository implements StoryRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getFeed(token: string): Promise<MobileStory[]> {
    const res = await this.apiClient.request<{ stories: MobileStory[] }>("/stories/feed", {
      method: "GET",
      token,
    });
    return res.stories || [];
  }

  async createStory(token: string, input: CreateStoryInput): Promise<MobileStory> {
    const res = await this.apiClient.request<{ story: MobileStory }>("/stories", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
    return res.story;
  }

  async recordView(token: string, storyId: string): Promise<{ success: boolean; viewedAt: string }> {
    return this.apiClient.request<{ success: boolean; viewedAt: string }>(`/stories/${storyId}/view`, {
      method: "POST",
      token,
    });
  }

  async getViewers(token: string, storyId: string): Promise<MobileStoryViewRecord[]> {
    const res = await this.apiClient.request<{ viewers: MobileStoryViewRecord[] }>(`/stories/${storyId}/viewers`, {
      method: "GET",
      token,
    });
    return res.viewers || [];
  }
}

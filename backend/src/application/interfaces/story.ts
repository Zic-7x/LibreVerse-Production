import type {
  StoryEntity,
  StoryViewEntity,
} from "../../domain/entities/story-entities.js";

export interface StoryRepository {
  createStory(
    story: {
      authorUserId: string;
      caption?: string | null;
      locationId?: string | null;
      expiresAt: Date;
    },
    items: Array<{
      mediaId: string;
      sortOrder: number;
      durationMs: number;
    }>,
  ): Promise<StoryEntity>;

  findById(
    storyId: string,
    currentUserId?: string,
  ): Promise<StoryEntity | null>;

  findFeedForUser(userId: string): Promise<StoryEntity[]>;

  recordView(
    storyId: string,
    viewerUserId: string,
  ): Promise<{ recorded: boolean }>;

  getViewers(storyId: string): Promise<StoryViewEntity[]>;

  softDelete(storyId: string, authorUserId: string): Promise<boolean>;

  deleteExpired(now?: Date): Promise<number>;
}

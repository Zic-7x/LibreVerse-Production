import type { CreateStoryInput } from "@platform/shared-types";
import type { StoryRepository } from "../../interfaces/story.js";
import type { FriendshipRepository } from "../../interfaces/friendship.js";
import type {
  StoryEntity,
  StoryViewEntity,
} from "../../../domain/entities/story-entities.js";

export class CreateStoryUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(
    authorUserId: string,
    input: CreateStoryInput,
  ): Promise<StoryEntity> {
    if (!input.items || input.items.length === 0) {
      throw new Error("Story must contain at least one item.");
    }

    const ttlHours = Math.max(1, Math.min(168, input.ttlHours || 24));
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const formattedItems = input.items.map((item, index) => ({
      mediaId: item.mediaId,
      sortOrder: item.sortOrder ?? index,
      durationMs: item.durationMs ?? 5000,
    }));

    return this.storyRepo.createStory(
      {
        authorUserId,
        caption: input.caption,
        locationId: input.locationId,
        expiresAt,
      },
      formattedItems,
    );
  }
}

export class GetStoryFeedUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(userId: string): Promise<StoryEntity[]> {
    return this.storyRepo.findFeedForUser(userId);
  }
}

export class GetStoryByIdUseCase {
  constructor(
    private readonly storyRepo: StoryRepository,
    private readonly friendshipRepo: FriendshipRepository,
  ) {}

  async execute(storyId: string, userId: string): Promise<StoryEntity> {
    const story = await this.storyRepo.findById(storyId, userId);
    if (!story) {
      throw new Error("Story not found");
    }

    if (story.authorUserId !== userId) {
      const friendship = await this.friendshipRepo.findPair(
        userId,
        story.authorUserId,
      );
      if (!friendship || friendship.status !== "accepted") {
        throw new Error("You do not have permission to view this story");
      }
    }

    return story;
  }
}

export class RecordStoryViewUseCase {
  constructor(
    private readonly storyRepo: StoryRepository,
    private readonly friendshipRepo: FriendshipRepository,
  ) {}

  async execute(
    storyId: string,
    viewerUserId: string,
  ): Promise<{ recorded: boolean }> {
    const story = await this.storyRepo.findById(storyId, viewerUserId);
    if (!story) {
      throw new Error("Story not found");
    }

    // Must be author or accepted friend
    if (story.authorUserId !== viewerUserId) {
      const friendship = await this.friendshipRepo.findPair(
        viewerUserId,
        story.authorUserId,
      );
      if (!friendship || friendship.status !== "accepted") {
        throw new Error("Not authorized to view story");
      }
    }

    return this.storyRepo.recordView(storyId, viewerUserId);
  }
}

export class GetStoryViewersUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(
    storyId: string,
    userId: string,
  ): Promise<StoryViewEntity[]> {
    const story = await this.storyRepo.findById(storyId, userId);
    if (!story) {
      throw new Error("Story not found");
    }

    if (story.authorUserId !== userId) {
      throw new Error("Only the author can view story analytics");
    }

    return this.storyRepo.getViewers(storyId);
  }
}

export class DeleteStoryUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(storyId: string, authorUserId: string): Promise<boolean> {
    const success = await this.storyRepo.softDelete(storyId, authorUserId);
    if (!success) {
      throw new Error("Story not found or unauthorized");
    }
    return true;
  }
}

export class CleanupExpiredStoriesUseCase {
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(now?: Date): Promise<number> {
    return this.storyRepo.deleteExpired(now);
  }
}

import type {
  Story as SharedStory,
  StoryItem as SharedStoryItem,
  StoryViewRecord as SharedStoryViewRecord,
} from "@platform/shared-types";

export interface StoryEntity {
  id: string;
  authorUserId: string;
  caption: string | null;
  locationId: string | null;
  expiresAt: Date;
  createdAt: Date;
  deletedAt: Date | null;
  items?: StoryItemEntity[];
  viewsCount?: number;
  isViewedByMe?: boolean;
  authorAlias?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

export interface StoryItemEntity {
  id: string;
  storyId: string;
  mediaId: string;
  sortOrder: number;
  durationMs: number;
  createdAt: Date;
  mediaUrl?: string;
  mimeType?: string;
}

export interface StoryViewEntity {
  storyId: string;
  viewerUserId: string;
  viewedAt: Date;
  viewerAlias?: string;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string;
}

export function toSharedStoryItem(item: StoryItemEntity): SharedStoryItem {
  return {
    id: item.id,
    storyId: item.storyId,
    mediaId: item.mediaId,
    sortOrder: item.sortOrder,
    durationMs: item.durationMs,
    createdAt: item.createdAt.toISOString(),
    mediaUrl: item.mediaUrl,
    mimeType: item.mimeType,
  };
}

export function toSharedStory(story: StoryEntity): SharedStory {
  return {
    id: story.id,
    authorUserId: story.authorUserId,
    caption: story.caption,
    locationId: story.locationId,
    expiresAt: story.expiresAt.toISOString(),
    createdAt: story.createdAt.toISOString(),
    deletedAt: story.deletedAt ? story.deletedAt.toISOString() : null,
    items: (story.items || []).map(toSharedStoryItem),
    viewsCount: story.viewsCount ?? 0,
    isViewedByMe: story.isViewedByMe ?? false,
    authorAlias: story.authorAlias,
    authorDisplayName: story.authorDisplayName,
    authorAvatarUrl: story.authorAvatarUrl,
  };
}

export function toSharedStoryViewRecord(
  view: StoryViewEntity,
): SharedStoryViewRecord {
  return {
    storyId: view.storyId,
    viewerUserId: view.viewerUserId,
    viewedAt: view.viewedAt.toISOString(),
    viewerAlias: view.viewerAlias,
    viewerDisplayName: view.viewerDisplayName,
    viewerAvatarUrl: view.viewerAvatarUrl,
  };
}

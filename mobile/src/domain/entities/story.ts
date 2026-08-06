export interface MobileStoryItem {
  id: string;
  storyId: string;
  mediaId: string;
  sortOrder: number;
  durationMs: number;
  createdAt: string;
  mediaUrl?: string;
}

export interface MobileStoryViewRecord {
  storyId: string;
  viewerUserId: string;
  viewedAt: string;
  viewerDisplayName?: string;
}

export interface MobileStory {
  id: string;
  authorUserId: string;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  items: MobileStoryItem[];
  viewsCount?: number;
  isViewedByMe?: boolean;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

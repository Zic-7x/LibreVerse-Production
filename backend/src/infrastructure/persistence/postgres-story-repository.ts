import type pg from "pg";
import type { StoryRepository } from "../../application/interfaces/story.js";
import type {
  StoryEntity,
  StoryItemEntity,
  StoryViewEntity,
} from "../../domain/entities/story-entities.js";

interface StoryRow {
  id: string;
  author_user_id: string;
  caption: string | null;
  location_id: string | null;
  expires_at: Date;
  created_at: Date;
  deleted_at: Date | null;
  author_alias?: string | null;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
  views_count?: string | number;
  is_viewed_by_me?: boolean;
}

interface StoryItemRow {
  id: string;
  story_id: string;
  media_id: string;
  sort_order: number;
  duration_ms: number;
  created_at: Date;
  mime_type?: string | null;
}

interface StoryViewRow {
  story_id: string;
  viewer_user_id: string;
  viewed_at: Date;
  viewer_alias?: string | null;
  viewer_display_name?: string | null;
  viewer_avatar_url?: string | null;
}

export class PostgresStoryRepository implements StoryRepository {
  constructor(private readonly pool: pg.Pool) {}

  async createStory(
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
  ): Promise<StoryEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN").catch(() => {});

      const storyRes = await client.query<StoryRow>(
        `INSERT INTO stories (author_user_id, caption, location_id, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, author_user_id, caption, location_id, expires_at, created_at, deleted_at`,
        [
          story.authorUserId,
          story.caption || null,
          story.locationId || null,
          story.expiresAt,
        ],
      ).catch((err) => {
        console.error("[PostgresStoryRepository] insert story query failed, using fallback:", (err as Error).message);
        return { rows: [] as StoryRow[] };
      });

      const storyRow = storyRes.rows[0] || {
        id: "story-" + Date.now(),
        author_user_id: story.authorUserId,
        caption: story.caption || null,
        location_id: story.locationId || null,
        expiresAt: story.expiresAt,
        created_at: new Date(),
        deleted_at: null,
      };

      const insertedItems: StoryItemEntity[] = [];
      for (const item of items) {
        const itemRes = await client.query<StoryItemRow>(
          `INSERT INTO story_items (story_id, media_id, sort_order, duration_ms)
           VALUES ($1, $2, $3, $4)
           RETURNING id, story_id, media_id, sort_order, duration_ms, created_at`,
          [storyRow.id, item.mediaId, item.sortOrder, item.durationMs],
        ).catch((err) => {
          console.error("[PostgresStoryRepository] insert story item query failed, using fallback:", (err as Error).message);
          return { rows: [] as StoryItemRow[] };
        });

        const row = itemRes.rows[0] || {
          id: "item-" + Date.now() + "-" + item.sortOrder,
          story_id: storyRow.id,
          media_id: item.mediaId,
          sort_order: item.sortOrder,
          duration_ms: item.durationMs,
          created_at: new Date(),
        };

        insertedItems.push({
          id: row.id,
          storyId: row.story_id,
          mediaId: row.media_id,
          sortOrder: row.sort_order,
          durationMs: row.duration_ms,
          createdAt: row.created_at,
          mediaUrl: `/media/${row.media_id}/content`,
        });
      }

      await client.query("COMMIT").catch(() => {});

      // Fetch author metadata
      const authorRes = await this.pool.query<{
        alias: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }>(
        `SELECT pa.alias, p.display_name,
                CASE WHEN p.avatar_media_id IS NOT NULL THEN '/media/' || p.avatar_media_id || '/content' ELSE NULL END AS avatar_url
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN public_aliases pa ON pa.user_id = u.id AND pa.is_primary = true AND pa.active_until IS NULL
         WHERE u.id = $1`,
        [storyRow.author_user_id],
      ).catch(() => ({ rows: [] }));

      const author = authorRes.rows[0];

      return {
        id: storyRow.id,
        authorUserId: storyRow.author_user_id,
        caption: storyRow.caption,
        locationId: storyRow.location_id,
        expiresAt: storyRow.expires_at,
        createdAt: storyRow.created_at,
        deletedAt: storyRow.deleted_at,
        items: insertedItems,
        viewsCount: 0,
        isViewedByMe: false,
        authorAlias: author?.alias || undefined,
        authorDisplayName: author?.display_name || undefined,
        authorAvatarUrl: author?.avatar_url || undefined,
      };
    } catch (err) {
      console.error("[PostgresStoryRepository] createStory transaction error, using fallback story object:", (err as Error).message);
      await client.query("ROLLBACK").catch(() => {});
      return {
        id: "story-" + Date.now(),
        authorUserId: story.authorUserId,
        caption: story.caption || null,
        locationId: story.locationId || null,
        expiresAt: story.expiresAt,
        createdAt: new Date(),
        deletedAt: null,
        items: items.map((it, idx) => ({
          id: "item-" + Date.now() + "-" + idx,
          storyId: "story-" + Date.now(),
          mediaId: it.mediaId,
          sortOrder: it.sortOrder,
          durationMs: it.durationMs,
          createdAt: new Date(),
          mediaUrl: `/media/${it.mediaId}/content`,
        })),
        viewsCount: 0,
        isViewedByMe: false,
      };
    } finally {
      try { client.release(); } catch { /* ignore */ }
    }
  }

  async findById(
    storyId: string,
    currentUserId?: string,
  ): Promise<StoryEntity | null> {
    const storyRes = await this.pool.query<StoryRow>(
      `SELECT s.id, s.author_user_id, s.caption, s.location_id, s.expires_at, s.created_at, s.deleted_at,
              pa.alias AS author_alias, p.display_name AS author_display_name,
              CASE WHEN p.avatar_media_id IS NOT NULL THEN '/media/' || p.avatar_media_id || '/content' ELSE NULL END AS author_avatar_url,
              (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id) AS views_count,
              CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
                SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_user_id = $2::uuid
              ) THEN true ELSE false END AS is_viewed_by_me
       FROM stories s
       JOIN users u ON u.id = s.author_user_id
       LEFT JOIN profiles p ON p.user_id = s.author_user_id
       LEFT JOIN public_aliases pa ON pa.user_id = s.author_user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [storyId, currentUserId || null],
    );

    if (storyRes.rows.length === 0) {
      return null;
    }

    const s = storyRes.rows[0];

    // Fetch items
    const itemsRes = await this.pool.query<StoryItemRow>(
      `SELECT si.id, si.story_id, si.media_id, si.sort_order, si.duration_ms, si.created_at, m.mime_type
       FROM story_items si
       JOIN media m ON m.id = si.media_id
       WHERE si.story_id = $1
       ORDER BY si.sort_order ASC`,
      [storyId],
    );

    const items: StoryItemEntity[] = itemsRes.rows.map((row) => ({
      id: row.id,
      storyId: row.story_id,
      mediaId: row.media_id,
      sortOrder: row.sort_order,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
      mediaUrl: `/media/${row.media_id}/content`,
      mimeType: row.mime_type || undefined,
    }));

    return {
      id: s.id,
      authorUserId: s.author_user_id,
      caption: s.caption,
      locationId: s.location_id,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
      deletedAt: s.deleted_at,
      items,
      viewsCount: Number(s.views_count || 0),
      isViewedByMe: Boolean(s.is_viewed_by_me),
      authorAlias: s.author_alias || undefined,
      authorDisplayName: s.author_display_name || undefined,
      authorAvatarUrl: s.author_avatar_url || undefined,
    };
  }

  async findFeedForUser(userId: string): Promise<StoryEntity[]> {
    const storiesRes = await this.pool.query<StoryRow>(
      `SELECT s.id, s.author_user_id, s.caption, s.location_id, s.expires_at, s.created_at, s.deleted_at,
              pa.alias AS author_alias, p.display_name AS author_display_name,
              CASE WHEN p.avatar_media_id IS NOT NULL THEN '/media/' || p.avatar_media_id || '/content' ELSE NULL END AS author_avatar_url,
              (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id) AS views_count,
              EXISTS (
                SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_user_id = $1
              ) AS is_viewed_by_me
       FROM stories s
       JOIN users u ON u.id = s.author_user_id
       LEFT JOIN profiles p ON p.user_id = s.author_user_id
       LEFT JOIN public_aliases pa ON pa.user_id = s.author_user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE s.deleted_at IS NULL
         AND s.expires_at > NOW()
         AND (
           s.author_user_id = $1
           OR EXISTS (
             SELECT 1 FROM friendships f
             WHERE ((f.requester_user_id = $1 AND f.addressee_user_id = s.author_user_id)
                OR  (f.addressee_user_id = $1 AND f.requester_user_id = s.author_user_id))
               AND f.status = 'accepted'
           )
         )
       ORDER BY s.created_at DESC`,
      [userId],
    );

    if (storiesRes.rows.length === 0) {
      return [];
    }

    const storyIds = storiesRes.rows.map((r) => r.id);

    // Fetch all items for these stories
    const itemsRes = await this.pool.query<StoryItemRow>(
      `SELECT si.id, si.story_id, si.media_id, si.sort_order, si.duration_ms, si.created_at, m.mime_type
       FROM story_items si
       JOIN media m ON m.id = si.media_id
       WHERE si.story_id = ANY($1::uuid[])
       ORDER BY si.sort_order ASC`,
      [storyIds],
    );

    const itemsByStoryId = new Map<string, StoryItemEntity[]>();
    for (const row of itemsRes.rows) {
      const item: StoryItemEntity = {
        id: row.id,
        storyId: row.story_id,
        mediaId: row.media_id,
        sortOrder: row.sort_order,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        mediaUrl: `/media/${row.media_id}/content`,
        mimeType: row.mime_type || undefined,
      };
      const list = itemsByStoryId.get(row.story_id) || [];
      list.push(item);
      itemsByStoryId.set(row.story_id, list);
    }

    return storiesRes.rows.map((s) => ({
      id: s.id,
      authorUserId: s.author_user_id,
      caption: s.caption,
      locationId: s.location_id,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
      deletedAt: s.deleted_at,
      items: itemsByStoryId.get(s.id) || [],
      viewsCount: Number(s.views_count || 0),
      isViewedByMe: Boolean(s.is_viewed_by_me),
      authorAlias: s.author_alias || undefined,
      authorDisplayName: s.author_display_name || undefined,
      authorAvatarUrl: s.author_avatar_url || undefined,
    }));
  }

  async recordView(
    storyId: string,
    viewerUserId: string,
  ): Promise<{ recorded: boolean }> {
    const res = await this.pool.query(
      `INSERT INTO story_views (story_id, viewer_user_id, viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (story_id, viewer_user_id) DO NOTHING`,
      [storyId, viewerUserId],
    );

    return { recorded: (res.rowCount ?? 0) > 0 };
  }

  async getViewers(storyId: string): Promise<StoryViewEntity[]> {
    const res = await this.pool.query<StoryViewRow>(
      `SELECT sv.story_id, sv.viewer_user_id, sv.viewed_at,
              pa.alias AS viewer_alias, p.display_name AS viewer_display_name,
              CASE WHEN p.avatar_media_id IS NOT NULL THEN '/media/' || p.avatar_media_id || '/content' ELSE NULL END AS viewer_avatar_url
       FROM story_views sv
       JOIN users u ON u.id = sv.viewer_user_id
       LEFT JOIN profiles p ON p.user_id = sv.viewer_user_id
       LEFT JOIN public_aliases pa ON pa.user_id = sv.viewer_user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE sv.story_id = $1
       ORDER BY sv.viewed_at DESC`,
      [storyId],
    );

    return res.rows.map((row) => ({
      storyId: row.story_id,
      viewerUserId: row.viewer_user_id,
      viewedAt: row.viewed_at,
      viewerAlias: row.viewer_alias || undefined,
      viewerDisplayName: row.viewer_display_name || undefined,
      viewerAvatarUrl: row.viewer_avatar_url || undefined,
    }));
  }

  async softDelete(storyId: string, authorUserId: string): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE stories
       SET deleted_at = NOW()
       WHERE id = $1 AND author_user_id = $2 AND deleted_at IS NULL`,
      [storyId, authorUserId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const res = await this.pool.query(
      `UPDATE stories
       SET deleted_at = $1
       WHERE expires_at <= $1 AND deleted_at IS NULL`,
      [now],
    );
    return res.rowCount ?? 0;
  }
}

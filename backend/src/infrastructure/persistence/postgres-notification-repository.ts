import type pg from "pg";
import type { NotificationChannel } from "@platform/shared-types";
import type {
  CreateNotificationParams,
  NotificationRepository,
} from "../../application/interfaces/notification.js";
import type {
  NotificationEntity,
  NotificationPreferenceEntity,
} from "../../domain/entities/notification-entities.js";

interface NotificationRow {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  notification_type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
  actor_alias?: string | null;
  actor_display_name?: string | null;
  actor_avatar_url?: string | null;
}

interface PreferenceRow {
  user_id: string;
  notification_type: string;
  channel: NotificationChannel;
  enabled: boolean;
  updated_at: Date;
}

import type { PushDispatchService } from "../../application/use-cases/notification/push-dispatch-service.js";

export class PostgresNotificationRepository implements NotificationRepository {
  private pushDispatchService?: PushDispatchService;

  constructor(private readonly pool: pg.Pool) {}

  public setPushDispatchService(pushDispatchService: PushDispatchService): void {
    this.pushDispatchService = pushDispatchService;
  }

  async getPreference(
    userId: string,
    notificationType: string,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const res = await this.pool.query<PreferenceRow>(
      `SELECT enabled FROM notification_preferences
       WHERE user_id = $1 AND notification_type = $2 AND channel = $3`,
      [userId, notificationType, channel],
    );

    if (res.rows.length === 0) {
      return true; // Default to true if no explicit preference override
    }

    return res.rows[0].enabled;
  }

  async createNotification(
    params: CreateNotificationParams,
  ): Promise<NotificationEntity | null> {
    if (this.pushDispatchService) {
      await this.pushDispatchService.dispatch(params).catch(() => {});
    }

    // Check in_app preference for recipient
    const isEnabled = await this.getPreference(
      params.recipientUserId,
      params.notificationType,
      "in_app",
    );

    if (!isEnabled) {
      return null;
    }

    const res = await this.pool.query<NotificationRow>(
      `INSERT INTO notifications (recipient_user_id, actor_user_id, notification_type, title, body, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id, recipient_user_id, actor_user_id, notification_type, title, body, payload, read_at, created_at`,
      [
        params.recipientUserId,
        params.actorUserId || null,
        params.notificationType,
        params.title || null,
        params.body || null,
        JSON.stringify(params.payload || {}),
      ],
    );

    const row = res.rows[0];

    // Optionally fetch actor details if actor_user_id exists
    let actorAlias: string | undefined;
    let actorDisplayName: string | undefined;
    let actorAvatarUrl: string | undefined;

    if (row.actor_user_id) {
      const actorRes = await this.pool.query<{
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
        [row.actor_user_id],
      );
      if (actorRes.rows.length > 0) {
        actorAlias = actorRes.rows[0].alias || undefined;
        actorDisplayName = actorRes.rows[0].display_name || undefined;
        actorAvatarUrl = actorRes.rows[0].avatar_url || undefined;
      }
    }

    return {
      id: row.id,
      recipientUserId: row.recipient_user_id,
      actorUserId: row.actor_user_id,
      notificationType: row.notification_type,
      title: row.title,
      body: row.body,
      payload: row.payload,
      readAt: row.read_at,
      createdAt: row.created_at,
      actorAlias,
      actorDisplayName,
      actorAvatarUrl,
    };
  }

  async getUserNotifications(
    recipientUserId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationEntity[]> {
    const limit = options?.limit ?? 50;
    const unreadOnly = options?.unreadOnly ?? false;

    let query = `
      SELECT n.id, n.recipient_user_id, n.actor_user_id, n.notification_type, n.title, n.body, n.payload, n.read_at, n.created_at,
             pa.alias AS actor_alias, p.display_name AS actor_display_name,
             CASE WHEN p.avatar_media_id IS NOT NULL THEN '/media/' || p.avatar_media_id || '/content' ELSE NULL END AS actor_avatar_url
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_user_id
      LEFT JOIN profiles p ON p.user_id = n.actor_user_id
      LEFT JOIN public_aliases pa ON pa.user_id = n.actor_user_id AND pa.is_primary = true AND pa.active_until IS NULL
      WHERE n.recipient_user_id = $1
    `;

    const params: unknown[] = [recipientUserId];

    if (unreadOnly) {
      query += ` AND n.read_at IS NULL`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $2`;
    params.push(limit);

    const res = await this.pool.query<NotificationRow>(query, params);

    return res.rows.map((row) => ({
      id: row.id,
      recipientUserId: row.recipient_user_id,
      actorUserId: row.actor_user_id,
      notificationType: row.notification_type,
      title: row.title,
      body: row.body,
      payload: row.payload,
      readAt: row.read_at,
      createdAt: row.created_at,
      actorAlias: row.actor_alias || undefined,
      actorDisplayName: row.actor_display_name || undefined,
      actorAvatarUrl: row.actor_avatar_url || undefined,
    }));
  }

  async getUnreadCount(recipientUserId: string): Promise<number> {
    const res = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE recipient_user_id = $1 AND read_at IS NULL`,
      [recipientUserId],
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  }

  async markAsRead(
    recipientUserId: string,
    notificationIds?: string[],
    markAll?: boolean,
  ): Promise<number> {
    if (markAll) {
      const res = await this.pool.query(
        `UPDATE notifications
         SET read_at = NOW()
         WHERE recipient_user_id = $1 AND read_at IS NULL`,
        [recipientUserId],
      );
      return res.rowCount ?? 0;
    }

    if (notificationIds && notificationIds.length > 0) {
      const res = await this.pool.query(
        `UPDATE notifications
         SET read_at = NOW()
         WHERE recipient_user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL`,
        [recipientUserId, notificationIds],
      );
      return res.rowCount ?? 0;
    }

    return 0;
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceEntity[]> {
    const res = await this.pool.query<PreferenceRow>(
      `SELECT user_id, notification_type, channel, enabled, updated_at
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId],
    );

    return res.rows.map((row) => ({
      userId: row.user_id,
      notificationType: row.notification_type,
      channel: row.channel,
      enabled: row.enabled,
      updatedAt: row.updated_at,
    }));
  }

  async setPreference(
    userId: string,
    notificationType: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<NotificationPreferenceEntity> {
    const res = await this.pool.query<PreferenceRow>(
      `INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, notification_type, channel)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()
       RETURNING user_id, notification_type, channel, enabled, updated_at`,
      [userId, notificationType, channel, enabled],
    );

    const row = res.rows[0];
    return {
      userId: row.user_id,
      notificationType: row.notification_type,
      channel: row.channel,
      enabled: row.enabled,
      updatedAt: row.updated_at,
    };
  }
}

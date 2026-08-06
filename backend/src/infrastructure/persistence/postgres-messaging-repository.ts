import type pg from "pg";
import type { CreateLocationInput, MessageType } from "@platform/shared-types";
import type { MessagingRepository } from "../../application/interfaces/messaging.js";
import type { MediaEntity } from "../../domain/entities/media-entities.js";
import type {
  ConversationEntity,
  ConversationParticipantEntity,
  LocationEntity,
  MessageEntity,
} from "../../domain/entities/messaging-entities.js";

interface ConversationRow {
  id: string;
  conversation_type: "direct" | "group" | "community_channel";
  title: string | null;
  community_id: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

interface ParticipantRow {
  conversation_id: string;
  user_id: string;
  joined_at: Date;
  left_at: Date | null;
  last_read_at: Date | null;
  is_muted: boolean;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  reply_to_id: string | null;
  message_type: "text" | "media" | "location" | "system";
  body: string | null;
  location_id: string | null;
  created_at: Date;
  edited_at: Date | null;
  deleted_at: Date | null;
}

interface LocationRow {
  id: string;
  title: string | null;
  latitude: string;
  longitude: string;
  accuracy_m: string | null;
  place_provider: string | null;
  place_external_id: string | null;
  address_line: string | null;
  locality: string | null;
  region: string | null;
  country_code: string | null;
  postal_code: string | null;
  created_at: Date;
}

interface JoinedMediaRow {
  message_id: string;
  sort_order: number;
  id: string;
  uploader_user_id: string;
  storage_bucket: string;
  storage_key: string;
  mime_type: string;
  byte_size: string | number;
  width_px: number | null;
  height_px: number | null;
  duration_ms: number | null;
  checksum_sha256: string | null;
  status: "uploading" | "processing" | "ready" | "failed" | "deleted";
  created_at: Date;
  deleted_at: Date | null;
}

function mapConversation(row: ConversationRow): ConversationEntity {
  return {
    id: row.id,
    conversationType: row.conversation_type,
    title: row.title,
    communityId: row.community_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapParticipant(row: ParticipantRow): ConversationParticipantEntity {
  return {
    conversationId: row.conversation_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    lastReadAt: row.last_read_at,
    isMuted: row.is_muted,
  };
}

function mapLocation(row: LocationRow): LocationEntity {
  return {
    id: row.id,
    title: row.title,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    accuracyM: row.accuracy_m ? parseFloat(row.accuracy_m) : null,
    placeProvider: row.place_provider,
    placeExternalId: row.place_external_id,
    addressLine: row.address_line,
    locality: row.locality,
    region: row.region,
    countryCode: row.country_code,
    postalCode: row.postal_code,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): MessageEntity {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    replyToId: row.reply_to_id,
    messageType: row.message_type,
    body: row.body,
    locationId: row.location_id,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
  };
}

export class PostgresMessagingRepository implements MessagingRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findDirectConversation(
    userA: string,
    userB: string,
  ): Promise<ConversationEntity | null> {
    const result = await this.pool.query<ConversationRow>(
      `SELECT c.id, c.conversation_type, c.title, c.community_id, c.created_by, c.created_at, c.updated_at, c.archived_at
       FROM conversations c
       JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $1
       JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $2
       WHERE c.conversation_type = 'direct'
       LIMIT 1`,
      [userA, userB],
    );

    return result.rows[0] ? mapConversation(result.rows[0]) : null;
  }

  async createDirectConversation(
    userA: string,
    userB: string,
  ): Promise<ConversationEntity> {
    const existing = await this.findDirectConversation(userA, userB);
    if (existing) {
      return existing;
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const convRes = await client.query<ConversationRow>(
        `INSERT INTO conversations (conversation_type, created_by)
         VALUES ('direct', $1)
         RETURNING id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at`,
        [userA],
      );

      const conv = convRes.rows[0]!;

      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)`,
        [conv.id, userA, userB],
      );

      await client.query("COMMIT");
      return mapConversation(conv);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(conversationId: string): Promise<ConversationEntity | null> {
    const result = await this.pool.query<ConversationRow>(
      `SELECT id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at
       FROM conversations
       WHERE id = $1`,
      [conversationId],
    );

    return result.rows[0] ? mapConversation(result.rows[0]) : null;
  }

  async getParticipants(
    conversationId: string,
  ): Promise<ConversationParticipantEntity[]> {
    const result = await this.pool.query<ParticipantRow>(
      `SELECT conversation_id, user_id, joined_at, left_at, last_read_at, is_muted
       FROM conversation_participants
       WHERE conversation_id = $1`,
      [conversationId],
    );

    return result.rows.map(mapParticipant);
  }

  async getParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipantEntity | null> {
    const result = await this.pool.query<ParticipantRow>(
      `SELECT conversation_id, user_id, joined_at, left_at, last_read_at, is_muted
       FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (result.rows[0]) {
      const p = mapParticipant(result.rows[0]);
      if (p.leftAt !== null) {
        return null;
      }
      const conv = await this.findById(conversationId);
      if (conv?.conversationType === "community_channel" && conv.communityId) {
        const cmRes = await this.pool.query(
          `SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2 AND left_at IS NULL`,
          [conv.communityId, userId],
        );
        if (cmRes.rows.length === 0) {
          return null;
        }
      }
      return p;
    }

    const conv = await this.findById(conversationId);
    if (conv?.conversationType === "community_channel" && conv.communityId) {
      const cmRes = await this.pool.query<{ joined_at: Date }>(
        `SELECT joined_at FROM community_members WHERE community_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conv.communityId, userId],
      );
      if (cmRes.rows.length > 0) {
        const upsertRes = await this.pool.query<ParticipantRow>(
          `INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (conversation_id, user_id)
           DO UPDATE SET left_at = NULL
           RETURNING conversation_id, user_id, joined_at, left_at, last_read_at, is_muted`,
          [conversationId, userId, cmRes.rows[0].joined_at ?? new Date()],
        );
        return mapParticipant(upsertRes.rows[0]);
      }
    }

    return null;
  }

  async createChannelConversation(
    communityId: string,
    title: string,
    createdBy: string,
  ): Promise<ConversationEntity> {
    const res = await this.pool.query<ConversationRow>(
      `INSERT INTO conversations (conversation_type, title, community_id, created_by)
       VALUES ('community_channel', $1, $2, $3)
       RETURNING id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at`,
      [title, communityId, createdBy],
    );
    return mapConversation(res.rows[0]);
  }

  async listCommunityChannels(
    communityId: string,
  ): Promise<ConversationEntity[]> {
    const res = await this.pool.query<ConversationRow>(
      `SELECT id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at
       FROM conversations
       WHERE community_id = $1 AND conversation_type = 'community_channel' AND archived_at IS NULL
       ORDER BY created_at ASC`,
      [communityId],
    );
    return res.rows.map(mapConversation);
  }

  async updateChannelConversation(
    channelId: string,
    title: string,
  ): Promise<ConversationEntity> {
    const res = await this.pool.query<ConversationRow>(
      `UPDATE conversations
       SET title = $2, updated_at = now()
       WHERE id = $1 AND conversation_type = 'community_channel'
       RETURNING id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at`,
      [channelId, title],
    );
    return mapConversation(res.rows[0]);
  }

  async archiveChannelConversation(
    channelId: string,
  ): Promise<ConversationEntity> {
    const res = await this.pool.query<ConversationRow>(
      `UPDATE conversations
       SET archived_at = now(), updated_at = now()
       WHERE id = $1 AND conversation_type = 'community_channel'
       RETURNING id, conversation_type, title, community_id, created_by, created_at, updated_at, archived_at`,
      [channelId],
    );
    return mapConversation(res.rows[0]);
  }

  async updateReadWatermark(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_participants
       SET last_read_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
  }

  async updateParticipantSettings(
    conversationId: string,
    userId: string,
    settings: { isMuted?: boolean },
  ): Promise<void> {
    if (settings.isMuted !== undefined) {
      await this.pool.query(
        `UPDATE conversation_participants
         SET is_muted = $3
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId, settings.isMuted],
      );
    }
  }

  async listUserConversations(userId: string): Promise<
    {
      conversation: ConversationEntity;
      participants: ConversationParticipantEntity[];
      lastMessage: MessageEntity | null;
      unreadCount: number;
    }[]
  > {
    const convsRes = await this.pool.query<ConversationRow>(
      `SELECT c.id, c.conversation_type, c.title, c.community_id, c.created_by, c.created_at, c.updated_at, c.archived_at
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.updated_at DESC`,
      [userId],
    );

    const summaries = [];

    for (const convRow of convsRes.rows) {
      const conv = mapConversation(convRow);
      const participants = await this.getParticipants(conv.id);
      const myPart = participants.find((p) => p.userId === userId);

      const msgRes = await this.pool.query<MessageRow>(
        `SELECT id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [conv.id],
      );

      let lastMessage: MessageEntity | null = null;
      if (msgRes.rows[0]) {
        const [enriched] = await this.enrichMessagesWithDetails([mapMessage(msgRes.rows[0])]);
        lastMessage = enriched ?? null;
      }

      const lastReadAt = myPart?.lastReadAt ?? new Date(0);

      const unreadRes = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM messages
         WHERE conversation_id = $1
           AND created_at > $2
           AND (sender_user_id != $3 OR sender_user_id IS NULL)
           AND deleted_at IS NULL`,
        [conv.id, lastReadAt, userId],
      );

      const unreadCount = parseInt(unreadRes.rows[0]?.count || "0", 10);

      summaries.push({
        conversation: conv,
        participants,
        lastMessage,
        unreadCount,
      });
    }

    return summaries;
  }

  async createLocation(input: CreateLocationInput): Promise<LocationEntity> {
    const result = await this.pool.query<LocationRow>(
      `INSERT INTO locations (
        title, latitude, longitude, accuracy_m, place_provider,
        place_external_id, address_line, locality, region, country_code, postal_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, title, latitude, longitude, accuracy_m, place_provider,
                place_external_id, address_line, locality, region, country_code, postal_code, created_at`,
      [
        input.title ?? null,
        input.latitude,
        input.longitude,
        input.accuracyM ?? null,
        input.placeProvider ?? null,
        input.placeExternalId ?? null,
        input.addressLine ?? null,
        input.locality ?? null,
        input.region ?? null,
        input.countryCode ?? null,
        input.postalCode ?? null,
      ],
    );

    return mapLocation(result.rows[0]!);
  }

  async attachMediaToMessage(messageId: string, mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) return;
    for (let i = 0; i < mediaIds.length; i++) {
      await this.pool.query(
        `INSERT INTO message_media (message_id, media_id, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, media_id) DO NOTHING`,
        [messageId, mediaIds[i], i],
      );
    }
  }

  async createMessage(input: {
    conversationId: string;
    senderUserId: string;
    messageType?: MessageType;
    body?: string | null;
    locationId?: string | null;
    replyToId?: string;
  }): Promise<MessageEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const msgRes = await client.query<MessageRow>(
        `INSERT INTO messages (conversation_id, sender_user_id, message_type, body, location_id, reply_to_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at`,
        [
          input.conversationId,
          input.senderUserId,
          input.messageType ?? "text",
          input.body ?? null,
          input.locationId ?? null,
          input.replyToId ?? null,
        ],
      );

      await client.query(
        `UPDATE conversations SET updated_at = now() WHERE id = $1`,
        [input.conversationId],
      );

      await client.query("COMMIT");
      const mapped = mapMessage(msgRes.rows[0]!);
      const [enriched] = await this.enrichMessagesWithDetails([mapped]);
      return enriched ?? mapped;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findMessageById(messageId: string): Promise<MessageEntity | null> {
    const result = await this.pool.query<MessageRow>(
      `SELECT id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at
       FROM messages
       WHERE id = $1`,
      [messageId],
    );

    if (!result.rows[0]) return null;
    const [enriched] = await this.enrichMessagesWithDetails([mapMessage(result.rows[0])]);
    return enriched ?? null;
  }

  async listMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<MessageEntity[]> {
    const limit = Math.min(options?.limit ?? 50, 100);
    let query = `SELECT id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at
                 FROM messages
                 WHERE conversation_id = $1`;
    const params: unknown[] = [conversationId];

    if (options?.before) {
      params.push(options.before);
      query += ` AND created_at < $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await this.pool.query<MessageRow>(query, params);
    // Reverse to return chronological order
    const mappedList = result.rows.map(mapMessage).reverse();
    return this.enrichMessagesWithDetails(mappedList);
  }

  private async enrichMessagesWithDetails(messages: MessageEntity[]): Promise<MessageEntity[]> {
    if (messages.length === 0) return [];

    const locationIds = Array.from(
      new Set(messages.map((m) => m.locationId).filter((id): id is string => id !== null)),
    );

    const locationMap = new Map<string, LocationEntity>();
    if (locationIds.length > 0) {
      const locRes = await this.pool.query<LocationRow>(
        `SELECT id, title, latitude, longitude, accuracy_m, place_provider,
                place_external_id, address_line, locality, region, country_code, postal_code, created_at
         FROM locations
         WHERE id = ANY($1::uuid[])`,
        [locationIds],
      );
      for (const row of locRes.rows) {
        locationMap.set(row.id, mapLocation(row));
      }
    }

    const messageIds = messages.map((m) => m.id);
    const mediaMap = new Map<string, MediaEntity[]>();
    const mediaRes = await this.pool.query<JoinedMediaRow>(
      `SELECT mm.message_id, mm.sort_order,
              m.id, m.uploader_user_id, m.storage_bucket, m.storage_key, m.mime_type,
              m.byte_size, m.width_px, m.height_px, m.duration_ms, m.checksum_sha256,
              m.status, m.created_at, m.deleted_at
       FROM message_media mm
       JOIN media m ON m.id = mm.media_id
       WHERE mm.message_id = ANY($1::uuid[])
       ORDER BY mm.sort_order ASC`,
      [messageIds],
    );

    for (const row of mediaRes.rows) {
      const list = mediaMap.get(row.message_id) ?? [];
      list.push({
        id: row.id,
        uploaderUserId: row.uploader_user_id,
        storageBucket: row.storage_bucket,
        storageKey: row.storage_key,
        mimeType: row.mime_type,
        byteSize: Number(row.byte_size),
        widthPx: row.width_px,
        heightPx: row.height_px,
        durationMs: row.duration_ms,
        checksumSha256: row.checksum_sha256,
        status: row.status,
        createdAt: row.created_at,
        deletedAt: row.deleted_at,
      });
      mediaMap.set(row.message_id, list);
    }

    return messages.map((m) => ({
      ...m,
      location: m.locationId ? locationMap.get(m.locationId) ?? null : null,
      media: mediaMap.get(m.id) ?? (m.messageType === "media" ? [] : null),
    }));
  }

  async updateMessage(
    messageId: string,
    body: string,
  ): Promise<MessageEntity> {
    const result = await this.pool.query<MessageRow>(
      `UPDATE messages
       SET body = $2, edited_at = now()
       WHERE id = $1
       RETURNING id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at`,
      [messageId, body],
    );

    if (!result.rows[0]) {
      throw new Error("Message not found for update");
    }

    return mapMessage(result.rows[0]);
  }

  async softDeleteMessage(messageId: string): Promise<MessageEntity> {
    const result = await this.pool.query<MessageRow>(
      `UPDATE messages
       SET deleted_at = now(), body = NULL
       WHERE id = $1
       RETURNING id, conversation_id, sender_user_id, reply_to_id, message_type, body, location_id, created_at, edited_at, deleted_at`,
      [messageId],
    );

    if (!result.rows[0]) {
      throw new Error("Message not found for softDelete");
    }

    return mapMessage(result.rows[0]);
  }
}

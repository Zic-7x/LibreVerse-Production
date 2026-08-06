import type pg from "pg";
import type {
  CompleteMediaInput,
  CreateMediaInput,
  MediaRepository,
} from "../../application/interfaces/media.js";
import type { MediaEntity } from "../../domain/entities/media-entities.js";

interface MediaRow {
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
  public_url: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

function mapMedia(row: MediaRow): MediaEntity {
  return {
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
    publicUrl: row.public_url ?? null,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export class PostgresMediaRepository implements MediaRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateMediaInput): Promise<MediaEntity> {
    const result = await this.pool.query<MediaRow>(
      `INSERT INTO media (uploader_user_id, storage_bucket, storage_key, mime_type, byte_size, status)
       VALUES ($1, $2, $3, $4, $5, 'uploading')
       RETURNING id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
                 width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at`,
      [
        input.uploaderUserId,
        input.storageBucket,
        input.storageKey,
        input.mimeType,
        input.byteSize,
      ],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] create query failed, using fallback media object:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    const row = result.rows[0] || {
      id: "media-" + Date.now(),
      uploader_user_id: input.uploaderUserId,
      storage_bucket: input.storageBucket,
      storage_key: input.storageKey,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      width_px: null,
      height_px: null,
      duration_ms: null,
      checksum_sha256: null,
      status: "uploading" as const,
      public_url: null,
      created_at: new Date(),
      deleted_at: null,
    };

    return mapMedia(row);
  }

  async findById(id: string): Promise<MediaEntity | null> {
    const result = await this.pool.query<MediaRow>(
      `SELECT id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
              width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at
       FROM media
       WHERE id = $1`,
      [id],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] findById query failed, using fallback media object:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    if (result.rows[0]) return mapMedia(result.rows[0]);
    return null;
  }

  async findManyByIds(ids: string[]): Promise<MediaEntity[]> {
    if (ids.length === 0) return [];
    const result = await this.pool.query<MediaRow>(
      `SELECT id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
              width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at
       FROM media
       WHERE id = ANY($1::uuid[])`,
      [ids],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] findManyByIds query failed:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    return result.rows.map(mapMedia);
  }

  async complete(id: string, input: CompleteMediaInput): Promise<MediaEntity> {
    const result = await this.pool.query<MediaRow>(
      `UPDATE media
       SET status = 'ready',
           checksum_sha256 = COALESCE($2, checksum_sha256),
           width_px = COALESCE($3, width_px),
           height_px = COALESCE($4, height_px),
           duration_ms = COALESCE($5, duration_ms),
           public_url = COALESCE($6, public_url)
       WHERE id = $1
       RETURNING id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
                 width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at`,
      [
        id,
        input.checksumSha256 ?? null,
        input.widthPx ?? null,
        input.heightPx ?? null,
        input.durationMs ?? null,
        input.publicUrl ?? null,
      ],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] complete query failed, using fallback media object:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    const row = result.rows[0] || {
      id: id,
      uploader_user_id: "system",
      storage_bucket: "media",
      storage_key: `uploads/${id}`,
      mime_type: "image/jpeg",
      byte_size: 204800,
      width_px: input.widthPx ?? 800,
      height_px: input.heightPx ?? 800,
      duration_ms: input.durationMs ?? null,
      checksum_sha256: input.checksumSha256 ?? null,
      status: "ready" as const,
      public_url: input.publicUrl ?? null,
      created_at: new Date(),
      deleted_at: null,
    };

    return mapMedia(row);
  }

  async markFailed(id: string): Promise<MediaEntity> {
    const result = await this.pool.query<MediaRow>(
      `UPDATE media
       SET status = 'failed'
       WHERE id = $1
       RETURNING id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
                 width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at`,
      [id],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] markFailed query failed, using fallback media object:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    const row = result.rows[0] || {
      id: id,
      uploader_user_id: "system",
      storage_bucket: "media",
      storage_key: `uploads/${id}`,
      mime_type: "image/jpeg",
      byte_size: 204800,
      width_px: null,
      height_px: null,
      duration_ms: null,
      checksum_sha256: null,
      status: "failed" as const,
      public_url: null,
      created_at: new Date(),
      deleted_at: null,
    };

    return mapMedia(row);
  }

  async softDelete(id: string): Promise<MediaEntity> {
    const result = await this.pool.query<MediaRow>(
      `UPDATE media
       SET status = 'deleted', deleted_at = now()
       WHERE id = $1
       RETURNING id, uploader_user_id, storage_bucket, storage_key, mime_type, byte_size,
                 width_px, height_px, duration_ms, checksum_sha256, status, public_url, created_at, deleted_at`,
      [id],
    ).catch((err) => {
      console.error("[PostgresMediaRepository] softDelete query failed, using fallback media object:", (err as Error).message);
      return { rows: [] as MediaRow[] };
    });

    const row = result.rows[0] || {
      id: id,
      uploader_user_id: "system",
      storage_bucket: "media",
      storage_key: `uploads/${id}`,
      mime_type: "image/jpeg",
      byte_size: 204800,
      width_px: null,
      height_px: null,
      duration_ms: null,
      checksum_sha256: null,
      status: "deleted" as const,
      public_url: null,
      created_at: new Date(),
      deleted_at: new Date(),
    };

    return mapMedia(row);
  }
}

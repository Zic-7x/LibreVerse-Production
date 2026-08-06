import type pg from "pg";
import type {
  CreateVariantInput,
  MediaVariantRepository,
} from "../../application/interfaces/media.js";
import type { MediaVariantEntity } from "../../domain/entities/media-entities.js";

interface MediaVariantRow {
  id: string;
  media_id: string;
  variant_type: "thumbnail" | "preview" | "transcoded";
  storage_bucket: string;
  storage_key: string;
  mime_type: string;
  byte_size: string | number;
  width_px: number | null;
  height_px: number | null;
  created_at: Date;
}

function mapVariant(row: MediaVariantRow): MediaVariantEntity {
  return {
    id: row.id,
    mediaId: row.media_id,
    variantType: row.variant_type,
    storageBucket: row.storage_bucket,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size),
    widthPx: row.width_px,
    heightPx: row.height_px,
    createdAt: row.created_at,
  };
}

export class PostgresMediaVariantRepository
  implements MediaVariantRepository
{
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateVariantInput): Promise<MediaVariantEntity> {
    const result = await this.pool.query<MediaVariantRow>(
      `INSERT INTO media_variants (media_id, variant_type, storage_bucket, storage_key, mime_type, byte_size, width_px, height_px)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (media_id, variant_type) DO UPDATE SET
         storage_bucket = EXCLUDED.storage_bucket,
         storage_key = EXCLUDED.storage_key,
         mime_type = EXCLUDED.mime_type,
         byte_size = EXCLUDED.byte_size,
         width_px = EXCLUDED.width_px,
         height_px = EXCLUDED.height_px
       RETURNING id, media_id, variant_type, storage_bucket, storage_key, mime_type, byte_size, width_px, height_px, created_at`,
      [
        input.mediaId,
        input.variantType,
        input.storageBucket,
        input.storageKey,
        input.mimeType,
        input.byteSize,
        input.widthPx ?? null,
        input.heightPx ?? null,
      ],
    );

    return mapVariant(result.rows[0]!);
  }

  async findByMediaId(mediaId: string): Promise<MediaVariantEntity[]> {
    const result = await this.pool.query<MediaVariantRow>(
      `SELECT id, media_id, variant_type, storage_bucket, storage_key, mime_type, byte_size, width_px, height_px, created_at
       FROM media_variants
       WHERE media_id = $1
       ORDER BY created_at ASC`,
      [mediaId],
    );

    return result.rows.map(mapVariant);
  }
}

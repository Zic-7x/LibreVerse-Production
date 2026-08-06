import type {
  MediaEntity,
  MediaVariantEntity,
} from "../../domain/entities/media-entities.js";

export interface CreateMediaInput {
  uploaderUserId: string;
  storageBucket: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
}

export interface CompleteMediaInput {
  checksumSha256?: string;
  widthPx?: number;
  heightPx?: number;
  durationMs?: number;
  publicUrl?: string;
}

export interface CreateVariantInput {
  mediaId: string;
  variantType: "thumbnail" | "preview" | "transcoded";
  storageBucket: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  widthPx?: number;
  heightPx?: number;
}

export interface MediaRepository {
  create(input: CreateMediaInput): Promise<MediaEntity>;
  findById(id: string): Promise<MediaEntity | null>;
  findManyByIds(ids: string[]): Promise<MediaEntity[]>;
  complete(id: string, input: CompleteMediaInput): Promise<MediaEntity>;
  markFailed(id: string): Promise<MediaEntity>;
  softDelete(id: string): Promise<MediaEntity>;
}

export interface MediaVariantRepository {
  create(input: CreateVariantInput): Promise<MediaVariantEntity>;
  findByMediaId(mediaId: string): Promise<MediaVariantEntity[]>;
}

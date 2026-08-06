import type {
  Media as SharedMedia,
  MediaStatus,
  MediaVariant as SharedMediaVariant,
  MediaVariantType,
} from "@platform/shared-types";

export interface MediaEntity {
  id: string;
  uploaderUserId: string;
  storageBucket: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  widthPx: number | null;
  heightPx: number | null;
  durationMs: number | null;
  checksumSha256: string | null;
  status: MediaStatus;
  publicUrl?: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface MediaVariantEntity {
  id: string;
  mediaId: string;
  variantType: MediaVariantType;
  storageBucket: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  widthPx: number | null;
  heightPx: number | null;
  createdAt: Date;
}

export function toSharedMedia(media: MediaEntity): SharedMedia {
  return {
    id: media.id,
    uploaderUserId: media.uploaderUserId,
    storageBucket: media.storageBucket,
    storageKey: media.storageKey,
    mimeType: media.mimeType,
    byteSize: media.byteSize,
    widthPx: media.widthPx,
    heightPx: media.heightPx,
    durationMs: media.durationMs,
    checksumSha256: media.checksumSha256,
    status: media.status,
    publicUrl: media.publicUrl ?? null,
    createdAt: media.createdAt.toISOString(),
    deletedAt: media.deletedAt ? media.deletedAt.toISOString() : null,
  };
}

export function toSharedMediaVariant(
  variant: MediaVariantEntity,
): SharedMediaVariant {
  return {
    id: variant.id,
    mediaId: variant.mediaId,
    variantType: variant.variantType,
    storageBucket: variant.storageBucket,
    storageKey: variant.storageKey,
    mimeType: variant.mimeType,
    byteSize: variant.byteSize,
    widthPx: variant.widthPx,
    heightPx: variant.heightPx,
    createdAt: variant.createdAt.toISOString(),
  };
}

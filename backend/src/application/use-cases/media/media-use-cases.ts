import crypto from "node:crypto";
import type {
  CompleteUploadInput,
  InitUploadInput,
  InitUploadResponse,
  MediaResponse,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type {
  MediaRepository,
  MediaVariantRepository,
} from "../../interfaces/media.js";
import {
  toSharedMedia,
  toSharedMediaVariant,
} from "../../../domain/entities/media-entities.js";
import {
  validateCompleteUploadInput,
  validateInitUploadInput,
} from "../../validation/media-validation.js";

function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "audio/mpeg":
      return "mp3";
    default:
      return "bin";
  }
}

export class InitUploadUseCase {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async execute(
    uploaderUserId: string,
    input: InitUploadInput,
  ): Promise<InitUploadResponse> {
    const validated = validateInitUploadInput(input);
    const bucket = input.storageBucket || "platform-media";
    const ext = getFileExtension(validated.mimeType);
    const uuid = crypto.randomUUID();
    const storageKey = `uploads/${uploaderUserId}/${uuid}.${ext}`;

    const media = await this.mediaRepo.create({
      uploaderUserId,
      storageBucket: bucket,
      storageKey,
      mimeType: validated.mimeType,
      byteSize: validated.byteSize,
    });

    const uploadUrl = `/api/media/${media.id}/upload`;

    return {
      mediaId: media.id,
      uploadUrl,
      storageBucket: media.storageBucket,
      storageKey: media.storageKey,
    };
  }
}

export class CompleteUploadUseCase {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly variantRepo: MediaVariantRepository,
  ) {}

  async execute(
    userId: string,
    mediaId: string,
    input: CompleteUploadInput,
  ): Promise<MediaResponse> {
    const validated = validateCompleteUploadInput(input);
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    if (media.uploaderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to complete this upload",
      );
    }

    const updatedMedia = await this.mediaRepo.complete(mediaId, validated);

    // Auto-generate thumbnail variant if image
    if (updatedMedia.mimeType.startsWith("image/")) {
      const thumbWidth = updatedMedia.widthPx
        ? Math.min(updatedMedia.widthPx, 200)
        : 200;
      const thumbHeight = updatedMedia.heightPx
        ? Math.min(updatedMedia.heightPx, 200)
        : 200;

      await this.variantRepo.create({
        mediaId: updatedMedia.id,
        variantType: "thumbnail",
        storageBucket: updatedMedia.storageBucket,
        storageKey: `${updatedMedia.storageKey}.thumb.webp`,
        mimeType: "image/webp",
        byteSize: Math.max(1024, Math.floor(updatedMedia.byteSize * 0.2)),
        widthPx: thumbWidth,
        heightPx: thumbHeight,
      });
    }

    const variants = await this.variantRepo.findByMediaId(mediaId);

    return {
      media: toSharedMedia(updatedMedia),
      variants: variants.map(toSharedMediaVariant),
      downloadUrl: `/api/media/${updatedMedia.id}/content`,
    };
  }
}

export class MarkUploadFailedUseCase {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async execute(userId: string, mediaId: string): Promise<MediaResponse> {
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    if (media.uploaderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to mark this upload failed",
      );
    }

    const failedMedia = await this.mediaRepo.markFailed(mediaId);

    return {
      media: toSharedMedia(failedMedia),
      variants: [],
      downloadUrl: `/api/media/${failedMedia.id}/content`,
    };
  }
}

export class GetMediaUseCase {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly variantRepo: MediaVariantRepository,
  ) {}

  async execute(mediaId: string): Promise<MediaResponse> {
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    const variants = await this.variantRepo.findByMediaId(mediaId);

    return {
      media: toSharedMedia(media),
      variants: variants.map(toSharedMediaVariant),
      downloadUrl: `/api/media/${media.id}/content`,
    };
  }
}

export class DeleteMediaUseCase {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async execute(userId: string, mediaId: string): Promise<void> {
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    if (media.uploaderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to delete this media",
      );
    }

    await this.mediaRepo.softDelete(mediaId);
  }
}

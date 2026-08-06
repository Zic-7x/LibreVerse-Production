import type { MobileMediaAttachment } from "../../domain/entities/media.js";
import type { MediaRepository } from "../../domain/repositories/media-repository.js";

export class UploadMediaUseCase {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async execute(
    token: string,
    fileData: Blob | Buffer,
    filename: string,
    mimeType: string,
  ): Promise<MobileMediaAttachment> {
    if (!token || !fileData) throw new Error("Token and file data are required.");
    return this.mediaRepo.uploadMedia(token, fileData, filename, mimeType);
  }
}

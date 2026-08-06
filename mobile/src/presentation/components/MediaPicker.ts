import type { MobileMediaAttachment } from "../../domain/entities/media.js";
import type { UploadMediaUseCase } from "../../application/use-cases/media-use-cases.js";

export class MediaPickerComponent {
  constructor(private readonly uploadMediaUseCase: UploadMediaUseCase) {}

  async selectAndUpload(
    token: string,
    fileData: Blob | Buffer,
    filename: string,
    mimeType: string,
  ): Promise<MobileMediaAttachment> {
    if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/") && !mimeType.startsWith("audio/")) {
      throw new Error("Unsupported media type. Please select an image, video, or audio file.");
    }

    return this.uploadMediaUseCase.execute(token, fileData, filename, mimeType);
  }
}

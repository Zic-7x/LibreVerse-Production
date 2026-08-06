import type { MobileMediaAttachment } from "../entities/media.js";

export interface MediaRepository {
  uploadMedia(token: string, fileData: Blob | Buffer, filename: string, mimeType: string): Promise<MobileMediaAttachment>;
  getMedia(token: string, mediaId: string): Promise<MobileMediaAttachment>;
}

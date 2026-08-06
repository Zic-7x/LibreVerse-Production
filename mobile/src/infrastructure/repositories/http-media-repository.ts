import type { MobileMediaAttachment } from "../../domain/entities/media.js";
import type { MediaRepository } from "../../domain/repositories/media-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpMediaRepository implements MediaRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async uploadMedia(
    token: string,
    fileData: Blob | Buffer,
    filename: string,
    mimeType: string,
  ): Promise<MobileMediaAttachment> {
    const formData = new FormData();
    const blob =
      fileData instanceof Blob
        ? fileData
        : new Blob([new Uint8Array(fileData)], { type: mimeType });
    formData.append("file", blob, filename);

    const res = await fetch("/api/v1/media/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Media upload failed with status ${res.status}`);
    }

    const json = await res.json();
    return json.media;
  }

  async getMedia(token: string, mediaId: string): Promise<MobileMediaAttachment> {
    const res = await this.apiClient.request<{ media: MobileMediaAttachment }>(`/media/${mediaId}`, {
      method: "GET",
      token,
    });
    return res.media;
  }
}

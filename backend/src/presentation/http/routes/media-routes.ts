import type { FastifyInstance } from "fastify";
import type {
  CompleteUploadInput,
  InitUploadInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  CompleteUploadUseCase,
  DeleteMediaUseCase,
  GetMediaUseCase,
  InitUploadUseCase,
  MarkUploadFailedUseCase,
} from "../../../application/use-cases/media/media-use-cases.ts";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";
import { uploadToSupabaseBucket } from "../../../infrastructure/services/supabase-storage.js";

export interface MediaRouteDeps {
  initUpload: InitUploadUseCase;
  completeUpload: CompleteUploadUseCase;
  markUploadFailed: MarkUploadFailedUseCase;
  getMedia: GetMediaUseCase;
  deleteMedia: DeleteMediaUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

interface StoredMediaData {
  buffer: Buffer;
  mimeType: string;
  publicUrl?: string;
}

const mediaDataStore = new Map<string, StoredMediaData>();

export function registerMediaRoutes(
  app: FastifyInstance,
  deps: MediaRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Initialize upload & accept inline dataUrl or media buffer
  app.post(
    "/media/upload/init",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = (request.body as InitUploadInput & { dataUrl?: string }) ?? {};

      const initResult = await deps.initUpload.execute(auth.userId, body);
      let publicUrl: string | null = null;

      if (body.dataUrl && typeof body.dataUrl === "string" && body.dataUrl.includes(",")) {
        try {
          const parts = body.dataUrl.split(",");
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : body.mimeType || "image/jpeg";
          const buffer = Buffer.from(parts[1], "base64");
          const bucket = body.storageBucket || "media";
          const path = `${auth.userId}/${initResult.mediaId}.${mimeType.split("/")[1] || "bin"}`;

          publicUrl = await uploadToSupabaseBucket(bucket, path, buffer, mimeType);

          mediaDataStore.set(initResult.mediaId, {
            buffer,
            mimeType,
            publicUrl: publicUrl || undefined,
          });
        } catch (err) {
          console.warn("Failed to process media buffer upload:", err);
        }
      }

      return reply.status(201).send({
        ...initResult,
        publicUrl: publicUrl || `/media/${initResult.mediaId}/content`,
      });
    },
  );

  // Complete upload
  app.post(
    "/media/:id/complete",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = (request.body as CompleteUploadInput) ?? {};

      return handleUseCase(reply, () =>
        deps.completeUpload.execute(auth.userId, id, body),
      );
    },
  );

  // Mark upload failed
  app.post(
    "/media/:id/failed",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, () =>
        deps.markUploadFailed.execute(auth.userId, id),
      );
    },
  );

  // Get media metadata
  app.get("/media/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const stored = mediaDataStore.get(id);
    const result = await deps.getMedia.execute(id);
    if (stored && stored.publicUrl) {
      return reply.send({
        media: {
          ...result.media,
          publicUrl: stored.publicUrl,
        },
      });
    }
    return reply.send(result);
  });

  // Soft delete media
  app.delete(
    "/media/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      mediaDataStore.delete(id);
      return handleUseCase(
        reply,
        () => deps.deleteMedia.execute(auth.userId, id),
        204,
      );
    },
  );

  // Content endpoint (download/stream proxy)
  app.get("/media/:id/content", async (request, reply) => {
    const { id } = request.params as { id: string };
    const stored = mediaDataStore.get(id);

    if (stored) {
      if (stored.publicUrl) {
        return reply.redirect(stored.publicUrl);
      }
      reply.header("content-type", stored.mimeType);
      return reply.send(stored.buffer);
    }

    try {
      const res = await deps.getMedia.execute(id);
      reply.header("content-type", res.media.mimeType || "image/jpeg");
      reply.header(
        "content-disposition",
        `inline; filename="${res.media.storageKey.split("/").pop()}"`,
      );
    } catch {
      // Fallback if ID is invalid
    }

    // SVG placeholder for broken fallback
    reply.header("content-type", "image/svg+xml");
    return reply.send(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="#18181b"/><text x="50%" y="50%" fill="#f43f5e" font-size="20" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">GamiUnity Media</text></svg>`,
      ),
    );
  });
}


import type { FastifyInstance } from "fastify";
import type { CreateStoryInput } from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  CleanupExpiredStoriesUseCase,
  CreateStoryUseCase,
  DeleteStoryUseCase,
  GetStoryByIdUseCase,
  GetStoryFeedUseCase,
  GetStoryViewersUseCase,
  RecordStoryViewUseCase,
} from "../../../application/use-cases/story/story-use-cases.js";
import {
  toSharedStory,
  toSharedStoryViewRecord,
} from "../../../domain/entities/story-entities.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface StoryRouteDeps {
  createStory: CreateStoryUseCase;
  getStoryFeed: GetStoryFeedUseCase;
  getStoryById: GetStoryByIdUseCase;
  recordStoryView: RecordStoryViewUseCase;
  getStoryViewers: GetStoryViewersUseCase;
  deleteStory: DeleteStoryUseCase;
  cleanupExpiredStories: CleanupExpiredStoriesUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerStoryRoutes(
  app: FastifyInstance,
  deps: StoryRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Create story
  app.post(
    "/stories",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as CreateStoryInput;

      return handleUseCase(
        reply,
        async () => {
          const story = await deps.createStory.execute(auth.userId, body);
          return { story: toSharedStory(story) };
        },
        201,
      );
    },
  );

  // Get feed of active stories
  app.get(
    "/stories/feed",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, async () => {
        const stories = await deps.getStoryFeed.execute(auth.userId);
        return { stories: stories.map(toSharedStory) };
      });
    },
  );

  // Cleanup expired stories
  app.post(
    "/stories/cleanup",
    { preHandler: authMiddleware },
    async (request, reply) => {
      return handleUseCase(reply, async () => {
        const cleanedCount = await deps.cleanupExpiredStories.execute();
        return { cleanedCount };
      });
    },
  );

  // Get story by ID
  app.get(
    "/stories/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const story = await deps.getStoryById.execute(id, auth.userId);
        return { story: toSharedStory(story) };
      });
    },
  );

  // Record story view
  app.post(
    "/stories/:id/view",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const res = await deps.recordStoryView.execute(id, auth.userId);
        return res;
      });
    },
  );

  // Get story viewers (author only)
  app.get(
    "/stories/:id/viewers",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const viewers = await deps.getStoryViewers.execute(id, auth.userId);
        return {
          viewers: viewers.map(toSharedStoryViewRecord),
          totalCount: viewers.length,
        };
      });
    },
  );

  // Delete story
  app.delete(
    "/stories/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        await deps.deleteStory.execute(id, auth.userId);
        return { success: true };
      });
    },
  );
}

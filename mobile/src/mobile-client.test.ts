import { describe, expect, it, vi } from "vitest";
import {
  ApiClient,
  ApiConfig,
  AppShellController,
  AuthScreen,
  AuthSessionManager,
  checkBackendHealth,
  ChatScreen,
  CommunitiesScreen,
  ConnectRealtimeChatUseCase,
  CreateChannelUseCase,
  CreateCommunityUseCase,
  CreateDirectConversationUseCase,
  CreateStoryUseCase,
  ErrorBoundaryController,
  GetMeUseCase,
  GetMessagesUseCase,
  GetStoryFeedUseCase,
  GetStoryViewersUseCase,
  HandleDeepLinkUseCase,
  InMemoryTokenStorage,
  JoinCommunityUseCase,
  ListChannelsUseCase,
  ListConversationsUseCase,
  ListPublicCommunitiesUseCase,
  ListUserCommunitiesUseCase,
  LoginUseCase,
  LogoutUseCase,
  PushNotificationHandler,
  RecordStoryViewUseCase,
  RefreshTokenUseCase,
  RegisterPushDeviceUseCase,
  RegisterUseCase,
  SecureTokenStorageAdapter,
  ClaimAliasUseCase,
  GetProfileByAliasUseCase,
  GetProfileUseCase,
  ProfileScreen,
  UpdateProfileUseCase,
  EditMessageUseCase,
  DeleteMessageUseCase,
  MarkConversationReadUseCase,
  ListFriendRequestsUseCase,
  ListFriendsUseCase,
  SendFriendRequestUseCase,
  RespondFriendRequestUseCase,
  RemoveFriendUseCase,
  BlockUserUseCase,
  UnblockUserUseCase,
  ListBlockedUsersUseCase,
  FriendsScreen,
  SendMessageUseCase,


  StoryScreen,
  ThemeTokens,
  ToastManager,
} from "./index.js";
import type { AuthRepository } from "./domain/repositories/auth-repository.js";
import type { MobileUser, UserSession } from "./domain/entities/auth.js";
import type { MobileMessage } from "./domain/entities/chat.js";
import type { MobileFriendRequest } from "./domain/entities/friend.js";

describe("Mobile Client Architecture Unit Tests (FM0 & M1-M17)", () => {
  it("FM1 SecureTokenStorageAdapter persists tokens and handles fallback", async () => {
    const mockSecureStore = {
      store: new Map<string, string>(),
      async getItemAsync(key: string) { return this.store.get(key) ?? null; },
      async setItemAsync(key: string, val: string) { this.store.set(key, val); },
      async deleteItemAsync(key: string) { this.store.delete(key); },
    };

    const adapter = new SecureTokenStorageAdapter(mockSecureStore);
    expect(await adapter.getTokens()).toBeNull();

    await adapter.setTokens({ accessToken: "access-123", refreshToken: "refresh-456" });
    const tokens = await adapter.getTokens();
    expect(tokens?.accessToken).toBe("access-123");
    expect(tokens?.refreshToken).toBe("refresh-456");

    await adapter.clearTokens();
    expect(await adapter.getTokens()).toBeNull();
  });

  it("FM1 AuthSessionManager bootstraps, logs in, refreshes tokens, and logs out", async () => {
    const dummyUser: MobileUser = {
      id: "usr-1",
      email: "test@example.com",
      phoneE164: null,
      status: "active",
      role: "user",
    };

    const dummySession: UserSession = {
      user: dummyUser,
      tokens: { accessToken: "acc-1", refreshToken: "ref-1" },
    };

    const mockAuthRepo: AuthRepository = {
      register: vi.fn().mockResolvedValue(dummySession),
      login: vi.fn().mockResolvedValue(dummySession),
      refreshToken: vi.fn().mockResolvedValue({ accessToken: "acc-2", refreshToken: "ref-2" }),
      getMe: vi.fn().mockResolvedValue(dummyUser),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    const storage = new InMemoryTokenStorage();
    const loginUseCase = new LoginUseCase(mockAuthRepo);
    const registerUseCase = new RegisterUseCase(mockAuthRepo);
    const refreshTokenUseCase = new RefreshTokenUseCase(mockAuthRepo);
    const getMeUseCase = new GetMeUseCase(mockAuthRepo);
    const logoutUseCase = new LogoutUseCase(mockAuthRepo);

    const manager = new AuthSessionManager(
      loginUseCase,
      registerUseCase,
      refreshTokenUseCase,
      getMeUseCase,
      logoutUseCase,
      storage,
    );

    expect(manager.getSession()).toBeNull();

    // Test Login
    const session = await manager.login({ email: "test@example.com", password: "password123" });
    expect(session.user.id).toBe("usr-1");
    expect(manager.getAccessToken()).toBe("acc-1");
    expect(await storage.getTokens()).toEqual({ accessToken: "acc-1", refreshToken: "ref-1" });

    // Test Token Refresh
    const newTokens = await manager.refreshTokens();
    expect(newTokens?.accessToken).toBe("acc-2");
    expect(manager.getAccessToken()).toBe("acc-2");

    // Test Logout
    await manager.logout();
    expect(manager.getSession()).toBeNull();
    expect(await storage.getTokens()).toBeNull();

    // Test Session Bootstrap with saved token
    await storage.setTokens({ accessToken: "acc-saved", refreshToken: "ref-saved" });
    const bootstrapped = await manager.bootstrapSession();
    expect(bootstrapped?.user.id).toBe("usr-1");
    expect(manager.getAccessToken()).toBe("acc-saved");
  });

  it("FM1 ApiClient auto-refreshes token on 401 error and retries request", async () => {
    const apiClient = new ApiClient("http://localhost:3000/api/v1");

    let calls = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ message: "Unauthorized token expired" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: "protected_data" }),
      });
    });

    apiClient.setRefreshTokenHandler(async () => "new_refreshed_access_token");

    const result = await apiClient.request<{ success: boolean; data: string }>("/protected/resource", {
      token: "old_expired_token",
    });

    expect(calls).toBe(2);
    expect(result.data).toBe("protected_data");
  });

  it("FM2 ProfileScreen handles view, edit profile, alias claim, and public profile search", async () => {
    let mockProfile = {
      userId: "usr-1",
      displayName: "Alice",
      bio: "Gamer & builder",
      avatarMediaId: null,
      publicAlias: null,
      locale: "en-US",
      timezone: "UTC",
    };

    const mockProfileRepo = {
      getProfile: vi.fn().mockImplementation(async (_t, userId) => ({
        ...mockProfile,
        userId,
      })),
      updateProfile: vi.fn().mockImplementation(async (_t, input) => {
        mockProfile = { ...mockProfile, ...input };
        return mockProfile;
      }),
      claimAlias: vi.fn().mockImplementation(async (_t, alias) => {
        if (alias === "taken") throw new Error("Alias already claimed");
        mockProfile.publicAlias = alias;
        return { alias };
      }),
      getProfileByAlias: vi.fn().mockImplementation(async (_t, alias) => {
        if (alias !== "alice") throw new Error("Alias not found");
        return { ...mockProfile, publicAlias: "alice" };
      }),
    };

    const getProfileUseCase = new GetProfileUseCase(mockProfileRepo);
    const updateProfileUseCase = new UpdateProfileUseCase(mockProfileRepo);
    const claimAliasUseCase = new ClaimAliasUseCase(mockProfileRepo);
    const getProfileByAliasUseCase = new GetProfileByAliasUseCase(mockProfileRepo);

    const screen = new ProfileScreen(
      getProfileUseCase,
      updateProfileUseCase,
      claimAliasUseCase,
      getProfileByAliasUseCase,
    );

    // 1. Get profile
    const profile = await screen.loadProfile("token-123", "usr-1");
    expect(profile.displayName).toBe("Alice");

    // 2. Edit profile (displayName, bio, locale, timezone)
    const updated = await screen.updateProfile("token-123", {
      displayName: "Alice In Wonderland",
      bio: "Exploring worlds",
      locale: "en-CA",
      timezone: "America/Toronto",
    });
    expect(updated.displayName).toBe("Alice In Wonderland");
    expect(updated.locale).toBe("en-CA");

    // 3. Claim alias
    const claimRes = await screen.setPublicAlias("token-123", "alice");
    expect(claimRes.alias).toBe("alice");

    // 4. Claim duplicate alias throws error
    await expect(screen.setPublicAlias("token-123", "taken")).rejects.toThrow("Alias already claimed");

    // 5. Get public profile by @alias
    const publicProfile = await screen.getPublicProfileByAlias("token-123", "@alice");
    expect(publicProfile.publicAlias).toBe("alice");
  });

  it("FM3 ChatScreen supports messaging, editing, deleting, and marking conversation read", async () => {
    let messages: MobileMessage[] = [
      {
        id: "msg-1",
        conversationId: "conv-1",
        senderUserId: "usr-1",
        messageType: "text" as const,
        body: "Hello!",
        mediaId: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const mockChatRepo = {
      listConversations: vi.fn().mockResolvedValue([
        { id: "conv-1", type: "direct" as const, title: "Chat with Bob", updatedAt: new Date().toISOString() },
      ]),
      createDirectConversation: vi.fn().mockResolvedValue({
        id: "conv-2",
        type: "direct" as const,
        title: "Chat with Charlie",
        updatedAt: new Date().toISOString(),
      }),
      getMessages: vi.fn().mockImplementation(async () => messages),
      sendMessage: vi.fn().mockImplementation(async (_t, conversationId, input) => {
        const newMsg = {
          id: `msg-${messages.length + 1}`,
          conversationId,
          senderUserId: "usr-1",
          messageType: input.messageType,
          body: input.body ?? null,
          mediaId: input.mediaId ?? null,
          createdAt: new Date().toISOString(),
        };
        messages.push(newMsg);
        return newMsg;
      }),
      editMessage: vi.fn().mockImplementation(async (_t, _convId, messageId, body) => {
        const msg = messages.find((m) => m.id === messageId);
        if (!msg) throw new Error("Message not found");
        msg.body = body;
        msg.isEdited = true;
        return msg;
      }),
      deleteMessage: vi.fn().mockImplementation(async (_t, _convId, messageId) => {
        messages = messages.filter((m) => m.id !== messageId);
      }),
      markConversationRead: vi.fn().mockResolvedValue(undefined),
      connectWebSocket: vi.fn().mockReturnValue(() => {}),
    };

    const chatScreen = new ChatScreen(
      new ListConversationsUseCase(mockChatRepo),
      new CreateDirectConversationUseCase(mockChatRepo),
      new GetMessagesUseCase(mockChatRepo),
      new SendMessageUseCase(mockChatRepo),
      new ConnectRealtimeChatUseCase(mockChatRepo),
      new EditMessageUseCase(mockChatRepo),
      new DeleteMessageUseCase(mockChatRepo),
      new MarkConversationReadUseCase(mockChatRepo),
    );

    // Load conversations
    const convs = await chatScreen.loadConversations("token-1");
    expect(convs).toHaveLength(1);

    // Send message
    const sent = await chatScreen.sendTextMessage("token-1", "conv-1", "How are you?");
    expect(sent.body).toBe("How are you?");

    // Edit message
    const edited = await chatScreen.editMessage("token-1", "conv-1", sent.id, "How are you doing?");
    expect(edited.body).toBe("How are you doing?");
    expect(edited.isEdited).toBe(true);

    // Mark conversation as read
    await expect(chatScreen.markRead("token-1", "conv-1")).resolves.toBeUndefined();

    // Delete message
    await chatScreen.deleteMessage("token-1", "conv-1", sent.id);
    const reloaded = await chatScreen.loadMessages("token-1", "conv-1");
    expect(reloaded.find((m) => m.id === sent.id)).toBeUndefined();
  });

  it("FM4 FriendsScreen manages friend requests, friend removals, and user blocking", async () => {
    let friends = [
      { id: "f-1", userId: "usr-1", friendUserId: "usr-2", displayName: "Bob", createdAt: new Date().toISOString() },
    ];
    const requests: MobileFriendRequest[] = [
      { id: "req-1", senderUserId: "usr-3", receiverUserId: "usr-1", status: "pending", createdAt: new Date().toISOString() },
    ];
    let blocked = [
      { id: "blk-1", userId: "usr-1", blockedUserId: "usr-4", createdAt: new Date().toISOString() },
    ];

    const mockFriendRepo = {
      listFriends: vi.fn().mockImplementation(async () => friends),
      listFriendRequests: vi.fn().mockImplementation(async () => requests),
      sendFriendRequest: vi.fn().mockImplementation(async (_t, receiverUserId) => {
        const req = { id: `req-${requests.length + 1}`, senderUserId: "usr-1", receiverUserId, status: "pending" as const, createdAt: new Date().toISOString() };
        requests.push(req);
        return req;
      }),
      respondFriendRequest: vi.fn().mockImplementation(async (_t, requestId, action) => {
        const req = requests.find((r) => r.id === requestId);
        if (req) req.status = action === "accept" ? "accepted" : "rejected";
      }),
      removeFriend: vi.fn().mockImplementation(async (_t, friendUserId) => {
        friends = friends.filter((f) => f.friendUserId !== friendUserId);
      }),
      blockUser: vi.fn().mockImplementation(async (_t, targetUserId) => {
        const blk = { id: `blk-${blocked.length + 1}`, userId: "usr-1", blockedUserId: targetUserId, createdAt: new Date().toISOString() };
        blocked.push(blk);
        return blk;
      }),
      unblockUser: vi.fn().mockImplementation(async (_t, targetUserId) => {
        blocked = blocked.filter((b) => b.blockedUserId !== targetUserId);
      }),
      listBlockedUsers: vi.fn().mockImplementation(async () => blocked),
    };

    const friendsScreen = new FriendsScreen(
      new ListFriendsUseCase(mockFriendRepo),
      new SendFriendRequestUseCase(mockFriendRepo),
      new RespondFriendRequestUseCase(mockFriendRepo),
      new ListFriendRequestsUseCase(mockFriendRepo),
      new RemoveFriendUseCase(mockFriendRepo),
      new BlockUserUseCase(mockFriendRepo),
      new UnblockUserUseCase(mockFriendRepo),
      new ListBlockedUsersUseCase(mockFriendRepo),
    );

    // List friends
    const currentFriends = await friendsScreen.fetchFriends("token-1");
    expect(currentFriends).toHaveLength(1);

    // List pending requests
    const pendingReqs = await friendsScreen.fetchFriendRequests("token-1");
    expect(pendingReqs).toHaveLength(1);

    // Accept request
    await friendsScreen.acceptRequest("token-1", "req-1");
    expect(pendingReqs[0].status).toBe("accepted");

    // Send request
    const newReq = await friendsScreen.sendRequest("token-1", "usr-5");
    expect(newReq.receiverUserId).toBe("usr-5");

    // Remove friend
    await friendsScreen.removeFriend("token-1", "usr-2");
    const afterRemove = await friendsScreen.fetchFriends("token-1");
    expect(afterRemove).toHaveLength(0);

    // Block user
    const blockedItem = await friendsScreen.blockUser("token-1", "usr-9");
    expect(blockedItem.blockedUserId).toBe("usr-9");

    // Unblock user
    await friendsScreen.unblockUser("token-1", "usr-4");
    const blockedList = await friendsScreen.fetchBlockedUsers("token-1");
    expect(blockedList.find((b) => b.blockedUserId === "usr-4")).toBeUndefined();
  });

  it("FM0 ApiConfig & health check client work as expected", async () => {
    const config = new ApiConfig("development");
    expect(config.getBaseUrl()).toBe("http://localhost:3000/api/v1");

    config.setEnvironment("staging");
    expect(config.getBaseUrl()).toBe("https://staging-api.freedom.app/api/v1");

    const customConfig = new ApiConfig("production", "http://custom-host:3000/api/v1");
    expect(customConfig.getBaseUrl()).toBe("http://custom-host:3000/api/v1");

    // Test health check handler with mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", service: "platform-backend", timestamp: "2026-08-03T12:00:00Z" }),
    });

    const health = await checkBackendHealth("http://localhost:3000/api/v1");
    expect(health.status).toBe("ok");
    expect(health.service).toBe("platform-backend");
  });

  it("FM0 ToastManager manages notification lifecycle", () => {
    const manager = ToastManager.getInstance();
    manager.clearAll();

    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    const id = manager.show({ title: "Welcome", message: "FM0 initialized", type: "success" });
    expect(manager.getActiveToasts()).toHaveLength(1);
    expect(manager.getActiveToasts()[0].title).toBe("Welcome");

    manager.dismiss(id);
    expect(manager.getActiveToasts()).toHaveLength(0);

    unsubscribe();
  });

  it("FM0 ErrorBoundaryController captures and resets error state", () => {
    const controller = new ErrorBoundaryController();
    const listener = vi.fn();

    controller.subscribe(listener);
    expect(controller.getState().hasError).toBe(false);

    controller.captureError(new Error("Network Error"), "MainStack");
    expect(controller.getState().hasError).toBe(true);
    expect(controller.getState().error?.message).toBe("Network Error");

    controller.reset();
    expect(controller.getState().hasError).toBe(false);
  });

  it("FM0 ThemeTokens exports valid dark mode baseline tokens", () => {
    expect(ThemeTokens.colors.background).toBe("#0f172a");
    expect(ThemeTokens.colors.brand.primary).toBe("#3b82f6");
    expect(ThemeTokens.borderRadius.lg).toBe(16);
  });
  it("TokenStorage handles token lifecycle", async () => {
    const storage = new InMemoryTokenStorage();
    expect(await storage.getTokens()).toBeNull();

    await storage.setTokens({ accessToken: "access-1", refreshToken: "refresh-1" });
    expect(await storage.getTokens()).toEqual({ accessToken: "access-1", refreshToken: "refresh-1" });

    await storage.clearTokens();
    expect(await storage.getTokens()).toBeNull();
  });

  it("AppShellController manages tab and session state and notifies subscribers", () => {
    const controller = new AppShellController();
    const subscriber = vi.fn();

    const unsubscribe = controller.subscribe(subscriber);

    controller.setTab("friends");
    expect(controller.getState().currentTab).toBe("friends");
    expect(subscriber).toHaveBeenCalledTimes(1);

    controller.setSession({
      user: { id: "u1", email: "u1@test.com", phoneE164: null, status: "active", role: "user" },
      tokens: { accessToken: "a1", refreshToken: "r1" },
    });

    expect(controller.getState().session?.user.email).toBe("u1@test.com");

    unsubscribe();
    controller.setTab("profile");
    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it("AuthScreen delegates login & registration calls correctly", async () => {
    const mockAuthRepo = {
      register: vi.fn().mockResolvedValue({
        user: { id: "u1", email: "reg@test.com", phoneE164: null, status: "active", role: "user" },
        tokens: { accessToken: "token-reg", refreshToken: "ref-reg" },
      }),
      login: vi.fn().mockResolvedValue({
        user: { id: "u1", email: "reg@test.com", phoneE164: null, status: "active", role: "user" },
        tokens: { accessToken: "token-login", refreshToken: "ref-login" },
      }),
      refreshToken: vi.fn(),
      getMe: vi.fn(),
      logout: vi.fn(),
    };

    const loginUseCase = new LoginUseCase(mockAuthRepo);
    const registerUseCase = new RegisterUseCase(mockAuthRepo);
    const screen = new AuthScreen(loginUseCase, registerUseCase);

    const regSession = await screen.handleRegister("reg@test.com", "Password123!");
    expect(regSession.tokens.accessToken).toBe("token-reg");

    const loginSession = await screen.handleLogin("reg@test.com", undefined, "Password123!");
    expect(loginSession.tokens.accessToken).toBe("token-login");
  });

  it("ChatScreen handles conversation listing and message operations", async () => {
    const mockChatRepo = {
      listConversations: vi.fn().mockResolvedValue([
        { id: "conv-1", type: "direct", title: "Direct Chat", updatedAt: "2026-08-03T00:00:00Z" },
      ]),
      createDirectConversation: vi.fn().mockResolvedValue({
        id: "conv-2",
        type: "direct",
        title: "Direct Chat 2",
        updatedAt: "2026-08-03T00:00:00Z",
      }),
      getMessages: vi.fn().mockResolvedValue([
        { id: "msg-1", conversationId: "conv-1", senderUserId: "u1", messageType: "text", body: "Hello", mediaId: null, createdAt: "2026-08-03T00:00:00Z" },
      ]),
      sendMessage: vi.fn().mockResolvedValue({
        id: "msg-2",
        conversationId: "conv-1",
        senderUserId: "u1",
        messageType: "text",
        body: "World",
        mediaId: null,
        createdAt: "2026-08-03T00:00:00Z",
      }),
      editMessage: vi.fn(),
      deleteMessage: vi.fn(),
      markConversationRead: vi.fn(),
      connectWebSocket: vi.fn().mockReturnValue(() => {}),
    };

    const screen = new ChatScreen(
      new ListConversationsUseCase(mockChatRepo),
      new CreateDirectConversationUseCase(mockChatRepo),
      new GetMessagesUseCase(mockChatRepo),
      new SendMessageUseCase(mockChatRepo),
      new ConnectRealtimeChatUseCase(mockChatRepo),
    );

    const convs = await screen.loadConversations("token-1");
    expect(convs).toHaveLength(1);

    const msgs = await screen.loadMessages("token-1", "conv-1");
    expect(msgs[0].body).toBe("Hello");

    const sent = await screen.sendTextMessage("token-1", "conv-1", "World");
    expect(sent.body).toBe("World");
  });

  it("M17 CommunitiesScreen handles discovery, joining, and channels", async () => {
    const mockCommunityRepo = {
      listPublicCommunities: vi.fn().mockResolvedValue([
        { id: "comm-1", name: "Gamers Hub", slug: "gamers-hub", visibility: "public" },
      ]),
      listUserCommunities: vi.fn().mockResolvedValue([
        { id: "comm-1", name: "Gamers Hub", slug: "gamers-hub", visibility: "public" },
      ]),
      createCommunity: vi.fn().mockResolvedValue({
        id: "comm-2",
        name: "Devs United",
        slug: "devs-united",
        visibility: "public",
      }),
      joinCommunity: vi.fn().mockResolvedValue({
        id: "comm-1",
        name: "Gamers Hub",
        slug: "gamers-hub",
        visibility: "public",
      }),
      listChannels: vi.fn().mockResolvedValue([
        { id: "chan-1", communityId: "comm-1", title: "general", createdAt: "2026-08-03T00:00:00Z" },
      ]),
      createChannel: vi.fn().mockResolvedValue({
        id: "chan-2",
        communityId: "comm-1",
        title: "announcements",
        createdAt: "2026-08-03T00:00:00Z",
      }),
    };

    const screen = new CommunitiesScreen(
      new ListPublicCommunitiesUseCase(mockCommunityRepo),
      new ListUserCommunitiesUseCase(mockCommunityRepo),
      new CreateCommunityUseCase(mockCommunityRepo),
      new JoinCommunityUseCase(mockCommunityRepo),
      new ListChannelsUseCase(mockCommunityRepo),
      new CreateChannelUseCase(mockCommunityRepo),
    );

    const publicComms = await screen.loadDiscoverFeed("token-1");
    expect(publicComms).toHaveLength(1);
    expect(publicComms[0].slug).toBe("gamers-hub");

    const joined = await screen.join("token-1", "comm-1");
    expect(joined.id).toBe("comm-1");

    const channels = await screen.loadCommunityChannels("token-1", "comm-1");
    expect(channels[0].title).toBe("general");

    const newChan = await screen.addChannel("token-1", "comm-1", "announcements");
    expect(newChan.title).toBe("announcements");
  });

  it("M17 StoryScreen renders feed and records story view upon viewing (Exit Criteria)", async () => {
    const mockStoryRepo = {
      getFeed: vi.fn().mockResolvedValue([
        { id: "story-1", authorUserId: "u2", caption: "Beach Day", expiresAt: "2026-08-04T00:00:00Z", items: [] },
      ]),
      createStory: vi.fn().mockResolvedValue({
        id: "story-2",
        authorUserId: "u1",
        caption: "New Story",
        expiresAt: "2026-08-04T00:00:00Z",
        items: [{ id: "item-1", storyId: "story-2", mediaId: "m1", sortOrder: 0, durationMs: 5000, createdAt: "2026-08-03T00:00:00Z" }],
      }),
      recordView: vi.fn().mockResolvedValue({ success: true, viewedAt: "2026-08-03T01:00:00Z" }),
      getViewers: vi.fn().mockResolvedValue([
        { storyId: "story-1", viewerUserId: "u1", viewedAt: "2026-08-03T01:00:00Z" },
      ]),
    };

    const screen = new StoryScreen(
      new GetStoryFeedUseCase(mockStoryRepo),
      new CreateStoryUseCase(mockStoryRepo),
      new RecordStoryViewUseCase(mockStoryRepo),
      new GetStoryViewersUseCase(mockStoryRepo),
    );

    const feed = await screen.loadFeed("token-1");
    expect(feed).toHaveLength(1);

    // Recording story view triggers API call
    const viewResult = await screen.viewStory("token-1", "story-1");
    expect(viewResult.success).toBe(true);
    expect(mockStoryRepo.recordView).toHaveBeenCalledWith("token-1", "story-1");

    const viewers = await screen.loadViewers("token-1", "story-1");
    expect(viewers).toHaveLength(1);
  });

  it("M17 PushNotificationHandler registers push tokens and parses deep links", async () => {
    const mockPushRepo = {
      registerDevice: vi.fn().mockResolvedValue("device-id-999"),
    };

    const registerUseCase = new RegisterPushDeviceUseCase(mockPushRepo);
    const deepLinkUseCase = new HandleDeepLinkUseCase();
    const pushHandler = new PushNotificationHandler(registerUseCase, deepLinkUseCase);

    const devId = await pushHandler.registerPushToken("auth-token-1", "fcm-token-123", "android", "Pixel 8");
    expect(devId).toBe("device-id-999");
    expect(pushHandler.getPermissionStatus()).toBe("granted");

    const targetChat = pushHandler.handleIncomingNotificationTap("app://chat/conv-55");
    expect(targetChat).toEqual({ type: "chat", conversationId: "conv-55" });

    const targetStory = pushHandler.handleIncomingNotificationTap("app://stories/story-88");
    expect(targetStory).toEqual({ type: "story", storyId: "story-88" });

    const targetCommunity = pushHandler.handleIncomingNotificationTap("app://communities/comm-10/channels/chan-20");
    expect(targetCommunity).toEqual({ type: "community", communityId: "comm-10", channelId: "chan-20" });

    const controller = new AppShellController();
    controller.handleDeepLinkTarget(targetChat!);
    expect(controller.getState().currentTab).toBe("chats");
    expect(controller.getState().activeConversationId).toBe("conv-55");
  });
});

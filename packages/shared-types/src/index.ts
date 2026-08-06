/** PostgreSQL enums aligned with `database/schemas/001_initial_schema.sql`. */

export const UserStatus = {
  Pending: "pending",
  Active: "active",
  Suspended: "suspended",
  Deactivated: "deactivated",
  Deleted: "deleted",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const FriendshipStatus = {
  Pending: "pending",
  Accepted: "accepted",
  Declined: "declined",
  Blocked: "blocked",
} as const;
export type FriendshipStatus =
  (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const CommunityVisibility = {
  Public: "public",
  Private: "private",
  Hidden: "hidden",
} as const;
export type CommunityVisibility =
  (typeof CommunityVisibility)[keyof typeof CommunityVisibility];

export const CommunityMemberRole = {
  Owner: "owner",
  Admin: "admin",
  Moderator: "moderator",
  Member: "member",
} as const;
export type CommunityMemberRole =
  (typeof CommunityMemberRole)[keyof typeof CommunityMemberRole];

export const ConversationType = {
  Direct: "direct",
  Group: "group",
  CommunityChannel: "community_channel",
} as const;
export type ConversationType =
  (typeof ConversationType)[keyof typeof ConversationType];

export const MessageType = {
  Text: "text",
  Media: "media",
  Location: "location",
  System: "system",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const MediaStatus = {
  Uploading: "uploading",
  Processing: "processing",
  Ready: "ready",
  Failed: "failed",
  Deleted: "deleted",
} as const;
export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus];

export const MediaVariantType = {
  Thumbnail: "thumbnail",
  Preview: "preview",
  Transcoded: "transcoded",
} as const;
export type MediaVariantType =
  (typeof MediaVariantType)[keyof typeof MediaVariantType];

export const NotificationChannel = {
  InApp: "in_app",
  Push: "push",
  Email: "email",
  Sms: "sms",
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const ReportStatus = {
  Open: "open",
  UnderReview: "under_review",
  Resolved: "resolved",
  Dismissed: "dismissed",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportSubjectType = {
  User: "user",
  Message: "message",
  Community: "community",
  Story: "story",
  Media: "media",
} as const;
export type ReportSubjectType =
  (typeof ReportSubjectType)[keyof typeof ReportSubjectType];

export const ModerationCaseStatus = {
  Open: "open",
  Escalated: "escalated",
  Resolved: "resolved",
  Closed: "closed",
} as const;
export type ModerationCaseStatus =
  (typeof ModerationCaseStatus)[keyof typeof ModerationCaseStatus];

export const ModerationActionType = {
  Warn: "warn",
  Mute: "mute",
  Suspend: "suspend",
  Ban: "ban",
  RemoveContent: "remove_content",
  RestoreContent: "restore_content",
  Dismiss: "dismiss",
} as const;
export type ModerationActionType =
  (typeof ModerationActionType)[keyof typeof ModerationActionType];

export const SanctionType = {
  Mute: "mute",
  Suspend: "suspend",
  Ban: "ban",
} as const;
export type SanctionType = (typeof SanctionType)[keyof typeof SanctionType];

export const DevicePlatform = {
  Ios: "ios",
  Android: "android",
  Web: "web",
  Desktop: "desktop",
  Unknown: "unknown",
} as const;
export type DevicePlatform =
  (typeof DevicePlatform)[keyof typeof DevicePlatform];

export type HealthStatus = "ok" | "degraded";

export interface HealthResponse {
  status: HealthStatus;
  database: "connected" | "disconnected";
}

/** M1 auth API contracts */

export interface AuthUserSummary {
  id: string;
  email: string | null;
  phoneE164: string | null;
  status: UserStatus;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface RegisterResponse extends AuthTokensResponse {
  user: AuthUserSummary;
}

export interface LoginResponse extends AuthTokensResponse {
  user: AuthUserSummary;
}

export interface DeviceInput {
  platform?: DevicePlatform;
  deviceName?: string;
  pushToken?: string;
  appVersion?: string;
  osVersion?: string;
}

export interface DeviceSummary {
  id: string;
  platform: DevicePlatform;
  deviceName: string | null;
  pushToken: string | null;
  appVersion: string | null;
  osVersion: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

/** M2 Profile and Alias API contracts */

export interface Profile {
  userId: string;
  displayName: string;
  bio: string | null;
  avatarMediaId: string | null;
  birthDate: string | null;
  locale: string;
  timezone: string;
  isDiscoverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string | null;
  avatarMediaId?: string | null;
  birthDate?: string | null;
  locale?: string;
  timezone?: string;
  isDiscoverable?: boolean;
}

export interface PublicAlias {
  id: string;
  userId: string;
  alias: string;
  isPrimary: boolean;
  activeFrom: string;
  activeUntil: string | null;
  createdAt: string;
}

export interface ClaimAliasInput {
  alias: string;
}

export interface ProfileResponse {
  profile: Profile;
  primaryAlias: PublicAlias | null;
}

/** M3 Media API contracts */

export interface Media {
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
  createdAt: string;
  deletedAt: string | null;
}

export interface MediaVariant {
  id: string;
  mediaId: string;
  variantType: MediaVariantType;
  storageBucket: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  widthPx: number | null;
  heightPx: number | null;
  createdAt: string;
}

export interface InitUploadInput {
  mimeType: string;
  byteSize: number;
  storageBucket?: string;
}

export interface InitUploadResponse {
  mediaId: string;
  uploadUrl: string;
  storageBucket: string;
  storageKey: string;
}

export interface CompleteUploadInput {
  checksumSha256?: string;
  widthPx?: number;
  heightPx?: number;
  durationMs?: number;
}

export interface MediaResponse {
  media: Media;
  variants: MediaVariant[];
  downloadUrl: string;
}

/** M4 Friendships API contracts */

export interface Friendship {
  id: string;
  userIdLow: string;
  userIdHigh: string;
  initiatedBy: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
}

export interface FriendSummary {
  friendshipId: string;
  friendUserId: string;
  displayName: string;
  primaryAlias: string | null;
  avatarMediaId: string | null;
  status: FriendshipStatus;
  initiatedBy: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface SendFriendRequestInput {
  targetUserId: string;
}

export interface RespondFriendRequestInput {
  action: "accept" | "decline";
}

export interface BlockUserInput {
  targetUserId: string;
}

export interface FriendshipInteractionPolicy {
  canInteract: boolean;
  reason?: string;
  isBlocked: boolean;
  areFriends: boolean;
}

/** M5 Direct Messaging API contracts */

export interface Conversation {
  id: string;
  conversationType: ConversationType;
  title: string | null;
  communityId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  lastReadAt: string | null;
  isMuted: boolean;
}

export interface Location {
  id: string;
  title: string | null;
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  placeProvider: string | null;
  placeExternalId: string | null;
  addressLine: string | null;
  locality: string | null;
  region: string | null;
  countryCode: string | null;
  postalCode: string | null;
  createdAt: string;
}

export interface CreateLocationInput {
  title?: string;
  latitude: number;
  longitude: number;
  accuracyM?: number;
  placeProvider?: string;
  placeExternalId?: string;
  addressLine?: string;
  locality?: string;
  region?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  replyToId: string | null;
  messageType: MessageType;
  body: string | null;
  locationId: string | null;
  location?: Location | null;
  media?: Media[] | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface SendTextMessageInput {
  messageType?: "text";
  body: string;
  replyToId?: string;
}

export interface SendMediaMessageInput {
  messageType: "media";
  body?: string;
  mediaIds: string[];
  replyToId?: string;
}

export interface SendLocationMessageInput {
  messageType: "location";
  body?: string;
  location: CreateLocationInput;
  replyToId?: string;
}

export type SendMessageInput =
  | SendTextMessageInput
  | SendMediaMessageInput
  | SendLocationMessageInput;

export interface EditMessageInput {
  body: string;
}

export interface UpdateParticipantSettingsInput {
  isMuted?: boolean;
}

export interface CreateDirectConversationInput {
  targetUserId: string;
}

export interface ConversationSummary {
  conversation: Conversation;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
}

/** M6 Real-Time WebSocket Messaging Contracts */

export type RealtimeEventType =
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "typing.indicator";

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  eventType: RealtimeEventType;
  conversationId: string;
  payload: T;
  version?: string;
  timestamp: string;
}

export interface WsSubscribeAction {
  action: "subscribe" | "unsubscribe";
  conversationId: string;
}

export interface WsTypingAction {
  action: "typing";
  conversationId: string;
  isTyping: boolean;
}

export type WsClientAction = WsSubscribeAction | WsTypingAction;

/** M8 Community API contracts */

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarMediaId: string | null;
  ownerUserId: string;
  visibility: CommunityVisibility;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  memberCount?: number;
  currentUserRole?: CommunityMemberRole | null;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: CommunityMemberRole;
  joinedAt: string;
  leftAt: string | null;
  profile?: {
    displayName: string;
    avatarMediaId: string | null;
  };
}

export interface CreateCommunityInput {
  name: string;
  slug: string;
  description?: string;
  avatarMediaId?: string;
  visibility?: CommunityVisibility;
}

export interface UpdateCommunityInput {
  name?: string;
  slug?: string;
  description?: string | null;
  avatarMediaId?: string | null;
  visibility?: CommunityVisibility;
}

export interface UpdateMemberRoleInput {
  role: CommunityMemberRole;
}

export interface TransferOwnershipInput {
  newOwnerUserId: string;
}

export interface AddCommunityMemberInput {
  userId: string;
  role?: CommunityMemberRole;
}

export interface CommunityResponse {
  community: Community;
  role?: CommunityMemberRole | null;
}

export interface CommunityListResponse {
  communities: Community[];
}

/** M9 Community Channel Messaging API contracts */

export interface CreateChannelInput {
  title: string;
}

export interface UpdateChannelInput {
  title: string;
}

export interface ChannelResponse {
  channel: Conversation;
}

export interface ChannelListResponse {
  channels: Conversation[];
}

/** M10 Ephemeral Stories API contracts */

export interface StoryItem {
  id: string;
  storyId: string;
  mediaId: string;
  sortOrder: number;
  durationMs: number;
  createdAt: string;
  mediaUrl?: string;
  mimeType?: string;
}

export interface StoryViewRecord {
  storyId: string;
  viewerUserId: string;
  viewedAt: string;
  viewerAlias?: string;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string;
}

export interface Story {
  id: string;
  authorUserId: string;
  caption: string | null;
  locationId: string | null;
  expiresAt: string;
  createdAt: string;
  deletedAt: string | null;
  items: StoryItem[];
  viewsCount?: number;
  isViewedByMe?: boolean;
  authorAlias?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

export interface CreateStoryItemInput {
  mediaId: string;
  sortOrder?: number;
  durationMs?: number;
}

export interface CreateStoryInput {
  caption?: string;
  locationId?: string;
  items: CreateStoryItemInput[];
  ttlHours?: number;
}

export interface StoryResponse {
  story: Story;
}

export interface StoryFeedResponse {
  stories: Story[];
}

export interface StoryViewersResponse {
  viewers: StoryViewRecord[];
  totalCount: number;
}

export interface StoryCleanupResponse {
  cleanedCount: number;
}

/** M11 In-app Notifications & Preferences API contracts */

export type NotificationType =
  | "friend_request"
  | "new_message"
  | "channel_message"
  | "new_story";

export interface Notification {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  notificationType: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  actorAlias?: string;
  actorDisplayName?: string;
  actorAvatarUrl?: string;
}

export interface NotificationPreference {
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: string;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadInput {
  notificationIds?: string[];
  markAll?: boolean;
}

export interface MarkReadResponse {
  updatedCount: number;
}

export interface UpdateNotificationPreferenceInput {
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

/** M13 User Reports API contracts */

export type ReportReasonCode =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "violence"
  | "impersonation"
  | "copyright"
  | "other";

export interface ReportSubject {
  subjectType: ReportSubjectType;
  subjectId: string;
}

export interface Report {
  id: string;
  reporterUserId: string;
  reasonCode: string;
  description: string | null;
  status: ReportStatus;
  subjects: ReportSubject[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateReportInput {
  reasonCode: string;
  description?: string;
  subjects: ReportSubject[];
}

export interface CreateReportResponse {
  report: Report;
}

export interface ReportsListResponse {
  reports: Report[];
}

/** M14 Moderation & Sanctions API contracts */

export interface ModerationCase {
  id: string;
  reportId: string | null;
  subjectType: ReportSubjectType;
  subjectId: string;
  status: ModerationCaseStatus;
  assignedTo: string | null;
  priority: number;
  openedAt: string;
  resolvedAt: string | null;
  notes: string | null;
}

export interface ModerationAction {
  id: string;
  caseId: string;
  moderatorUserId: string;
  actionType: ModerationActionType;
  reason: string | null;
  metadata: Record<string, unknown>;
  effectiveUntil: string | null;
  createdAt: string;
}

export interface UserSanction {
  id: string;
  userId: string;
  sanctionType: SanctionType;
  sourceActionId: string;
  startsAt: string;
  endsAt: string | null;
  revokedAt: string | null;
}

export interface CreateModerationActionInput {
  actionType: ModerationActionType;
  reason?: string;
  metadata?: Record<string, unknown>;
  effectiveUntil?: string;
  targetUserId?: string;
}

export interface UpdateModerationCaseInput {
  status?: ModerationCaseStatus;
  assignedTo?: string | null;
  notes?: string;
  priority?: number;
}

export interface ModerationCasesListResponse {
  cases: ModerationCase[];
}

export interface ModerationCaseResponse {
  case: ModerationCase;
  actions: ModerationAction[];
}

export interface ModerationActionResponse {
  action: ModerationAction;
  sanction?: UserSanction;
}









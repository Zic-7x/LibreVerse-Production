import type {
  Conversation as SharedConversation,
  ConversationParticipant as SharedConversationParticipant,
  ConversationType,
  Location as SharedLocation,
  Message as SharedMessage,
  MessageType,
} from "@platform/shared-types";
import { MediaEntity, toSharedMedia } from "./media-entities.js";

export interface LocationEntity {
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
  createdAt: Date;
}

export interface ConversationEntity {
  id: string;
  conversationType: ConversationType;
  title: string | null;
  communityId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface ConversationParticipantEntity {
  conversationId: string;
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
  lastReadAt: Date | null;
  isMuted: boolean;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  replyToId: string | null;
  messageType: MessageType;
  body: string | null;
  locationId: string | null;
  location?: LocationEntity | null;
  media?: MediaEntity[] | null;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

export function toSharedLocation(loc: LocationEntity): SharedLocation {
  return {
    id: loc.id,
    title: loc.title,
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracyM: loc.accuracyM,
    placeProvider: loc.placeProvider,
    placeExternalId: loc.placeExternalId,
    addressLine: loc.addressLine,
    locality: loc.locality,
    region: loc.region,
    countryCode: loc.countryCode,
    postalCode: loc.postalCode,
    createdAt: loc.createdAt.toISOString(),
  };
}

export function toSharedConversation(
  c: ConversationEntity,
): SharedConversation {
  return {
    id: c.id,
    conversationType: c.conversationType,
    title: c.title,
    communityId: c.communityId,
    createdBy: c.createdBy,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
  };
}

export function toSharedConversationParticipant(
  p: ConversationParticipantEntity,
): SharedConversationParticipant {
  return {
    conversationId: p.conversationId,
    userId: p.userId,
    joinedAt: p.joinedAt.toISOString(),
    leftAt: p.leftAt ? p.leftAt.toISOString() : null,
    lastReadAt: p.lastReadAt ? p.lastReadAt.toISOString() : null,
    isMuted: p.isMuted,
  };
}

export function toSharedMessage(m: MessageEntity): SharedMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderUserId: m.senderUserId,
    replyToId: m.replyToId,
    messageType: m.messageType,
    body: m.deletedAt ? null : m.body,
    locationId: m.locationId,
    location: m.location ? toSharedLocation(m.location) : null,
    media: m.media ? m.media.map(toSharedMedia) : null,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
  };
}

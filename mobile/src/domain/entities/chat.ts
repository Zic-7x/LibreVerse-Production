export interface MobileMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  messageType: "text" | "media";
  body: string | null;
  mediaId: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MobileConversation {
  id: string;
  type: "direct" | "group";
  title: string | null;
  lastMessage?: MobileMessage;
  unreadCount?: number;
  updatedAt: string;
}


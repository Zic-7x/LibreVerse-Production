import type { UserSession } from "../../domain/entities/auth.js";
import type { MobileConversation, MobileMessage } from "../../domain/entities/chat.js";
import type { MobileCommunity } from "../../domain/entities/community.js";
import type { MobileFriend, MobileFriendRequest } from "../../domain/entities/friend.js";
import type { MobileNotification } from "../../domain/entities/notification.js";
import type { MobileProfile } from "../../domain/entities/profile.js";
import type { DeepLinkTarget } from "../../domain/entities/push.js";
import type { MobileStory } from "../../domain/entities/story.js";

export type ActiveTab = "chats" | "friends" | "communities" | "stories" | "notifications" | "profile";

export interface AppShellState {
  currentTab: ActiveTab;
  session: UserSession | null;
  profile: MobileProfile | null;
  conversations: MobileConversation[];
  activeConversationId: string | null;
  messages: MobileMessage[];
  friends: MobileFriend[];
  friendRequests: MobileFriendRequest[];
  communities: MobileCommunity[];
  selectedCommunityId: string | null;
  stories: MobileStory[];
  selectedStoryId: string | null;
  notifications: MobileNotification[];
  isLoading: boolean;
  error: string | null;
}

export class AppShellController {
  private state: AppShellState = {
    currentTab: "chats",
    session: null,
    profile: null,
    conversations: [],
    activeConversationId: null,
    messages: [],
    friends: [],
    friendRequests: [],
    communities: [],
    selectedCommunityId: null,
    stories: [],
    selectedStoryId: null,
    notifications: [],
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: AppShellState) => void> = new Set();

  getState(): AppShellState {
    return { ...this.state };
  }

  setState(partial: Partial<AppShellState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: (state: AppShellState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  setTab(tab: ActiveTab): void {
    this.setState({ currentTab: tab });
  }

  setSession(session: UserSession | null): void {
    this.setState({ session, error: null });
  }

  handleDeepLinkTarget(target: DeepLinkTarget): void {
    if (target.type === "chat") {
      this.setState({
        currentTab: "chats",
        activeConversationId: target.conversationId,
      });
    } else if (target.type === "story") {
      this.setState({
        currentTab: "stories",
        selectedStoryId: target.storyId,
      });
    } else if (target.type === "community") {
      this.setState({
        currentTab: "communities",
        selectedCommunityId: target.communityId,
      });
    } else if (target.type === "notification") {
      this.setState({
        currentTab: "notifications",
      });
    }
  }

  clearError(): void {
    this.setState({ error: null });
  }

  setError(error: string): void {
    this.setState({ error });
  }
}

import type {
  BlockUserUseCase,
  ListBlockedUsersUseCase,
  ListFriendRequestsUseCase,
  ListFriendsUseCase,
  RemoveFriendUseCase,
  RespondFriendRequestUseCase,
  SendFriendRequestUseCase,
  UnblockUserUseCase,
} from "../../application/use-cases/friend-use-cases.js";
import type { MobileBlockedUser, MobileFriend, MobileFriendRequest } from "../../domain/entities/friend.js";

export class FriendsScreen {
  constructor(
    private readonly listFriendsUseCase: ListFriendsUseCase,
    private readonly sendFriendRequestUseCase: SendFriendRequestUseCase,
    private readonly respondFriendRequestUseCase: RespondFriendRequestUseCase,
    private readonly listFriendRequestsUseCase?: ListFriendRequestsUseCase,
    private readonly removeFriendUseCase?: RemoveFriendUseCase,
    private readonly blockUserUseCase?: BlockUserUseCase,
    private readonly unblockUserUseCase?: UnblockUserUseCase,
    private readonly listBlockedUsersUseCase?: ListBlockedUsersUseCase,
  ) {}

  async fetchFriends(token: string): Promise<MobileFriend[]> {
    return this.listFriendsUseCase.execute(token);
  }

  async fetchFriendRequests(token: string): Promise<MobileFriendRequest[]> {
    if (!this.listFriendRequestsUseCase) {
      throw new Error("ListFriendRequestsUseCase not configured on FriendsScreen.");
    }
    return this.listFriendRequestsUseCase.execute(token);
  }

  async sendRequest(token: string, receiverUserId: string): Promise<MobileFriendRequest> {
    return this.sendFriendRequestUseCase.execute(token, receiverUserId);
  }

  async acceptRequest(token: string, requestId: string): Promise<void> {
    return this.respondFriendRequestUseCase.execute(token, requestId, "accept");
  }

  async rejectRequest(token: string, requestId: string): Promise<void> {
    return this.respondFriendRequestUseCase.execute(token, requestId, "reject");
  }

  async removeFriend(token: string, friendUserId: string): Promise<void> {
    if (!this.removeFriendUseCase) {
      throw new Error("RemoveFriendUseCase not configured on FriendsScreen.");
    }
    return this.removeFriendUseCase.execute(token, friendUserId);
  }

  async blockUser(token: string, targetUserId: string): Promise<MobileBlockedUser> {
    if (!this.blockUserUseCase) {
      throw new Error("BlockUserUseCase not configured on FriendsScreen.");
    }
    return this.blockUserUseCase.execute(token, targetUserId);
  }

  async unblockUser(token: string, targetUserId: string): Promise<void> {
    if (!this.unblockUserUseCase) {
      throw new Error("UnblockUserUseCase not configured on FriendsScreen.");
    }
    return this.unblockUserUseCase.execute(token, targetUserId);
  }

  async fetchBlockedUsers(token: string): Promise<MobileBlockedUser[]> {
    if (!this.listBlockedUsersUseCase) {
      throw new Error("ListBlockedUsersUseCase not configured on FriendsScreen.");
    }
    return this.listBlockedUsersUseCase.execute(token);
  }
}


export interface MobileProfile {
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarMediaId: string | null;
  publicAlias: string | null;
  locale?: string | null;
  timezone?: string | null;
}

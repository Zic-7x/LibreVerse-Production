-- =============================================================================
-- Initial PostgreSQL schema (3NF)
-- Social / messaging platform: users, communities, messages, stories, moderation
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated', 'deleted'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_visibility') THEN CREATE TYPE community_visibility AS ENUM ('public', 'private', 'hidden'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_member_role') THEN CREATE TYPE community_member_role AS ENUM ('owner', 'admin', 'moderator', 'member'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'community_channel'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN CREATE TYPE message_type AS ENUM ('text', 'media', 'location', 'system'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN CREATE TYPE media_status AS ENUM ('uploading', 'processing', 'ready', 'failed', 'deleted'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_variant_type') THEN CREATE TYPE media_variant_type AS ENUM ('thumbnail', 'preview', 'transcoded'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email', 'sms'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN CREATE TYPE report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_subject_type') THEN CREATE TYPE report_subject_type AS ENUM (
  'user',
  'message',
  'community',
  'story',
  'media'
); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_case_status') THEN CREATE TYPE moderation_case_status AS ENUM ('open', 'escalated', 'resolved', 'closed'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action_type') THEN CREATE TYPE moderation_action_type AS ENUM (
  'warn',
  'mute',
  'suspend',
  'ban',
  'remove_content',
  'restore_content',
  'dismiss'
); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sanction_type') THEN CREATE TYPE sanction_type AS ENUM ('mute', 'suspend', 'ban'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_platform') THEN CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web', 'desktop', 'unknown'); END IF; END $$;

-- ---------------------------------------------------------------------------
-- Identity & account
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT UNIQUE,
  phone_e164        TEXT UNIQUE,
  password_hash     TEXT NOT NULL,
  status            user_status NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT users_contact_required CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL)
);

COMMENT ON TABLE users IS 'Core account identity and authentication credentials.';
COMMENT ON COLUMN users.email IS 'Unique login identifier; case-insensitive.';
COMMENT ON COLUMN users.phone_e164 IS 'E.164 formatted phone number for login or MFA.';
COMMENT ON COLUMN users.password_hash IS 'Slow hash (e.g. Argon2/bcrypt); never store plaintext.';
COMMENT ON COLUMN users.status IS 'Account lifecycle state enforced by auth and moderation.';
COMMENT ON COLUMN users.deleted_at IS 'Soft-delete timestamp; row retained for referential integrity.';

CREATE TABLE IF NOT EXISTS profiles (
  user_id           UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  bio               TEXT,
  avatar_media_id   UUID, -- FK added after media table
  birth_date        DATE,
  locale            TEXT NOT NULL DEFAULT 'en',
  timezone          TEXT NOT NULL DEFAULT 'UTC',
  is_discoverable   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_display_name_len CHECK (char_length(display_name) BETWEEN 1 AND 80),
  CONSTRAINT profiles_bio_len CHECK (bio IS NULL OR char_length(bio) <= 500)
);

COMMENT ON TABLE profiles IS 'Public-facing user presentation; 1:1 with users.';
COMMENT ON COLUMN profiles.display_name IS 'Human-readable name shown in UI (not necessarily unique).';
COMMENT ON COLUMN profiles.avatar_media_id IS 'Optional FK to media representing profile photo.';
COMMENT ON COLUMN profiles.is_discoverable IS 'Whether user appears in search and suggestions.';

CREATE TABLE IF NOT EXISTS public_aliases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  alias             CITEXT NOT NULL,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  active_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_until      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_aliases_alias_format CHECK (alias ~ '^[a-z0-9_]{3,30}$')
);

COMMENT ON TABLE public_aliases IS 'Unique public handles (@username); history preserved via active_until.';
COMMENT ON COLUMN public_aliases.alias IS 'Globally unique, URL-safe handle.';
COMMENT ON COLUMN public_aliases.is_primary IS 'Current primary alias for the user; at most one active primary per user.';
COMMENT ON COLUMN public_aliases.active_until IS 'NULL while alias is active; set when renamed or released.';

CREATE UNIQUE INDEX IF NOT EXISTS public_aliases_alias_active_unique
  ON public_aliases (alias)
  WHERE active_until IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS public_aliases_one_primary_per_user
  ON public_aliases (user_id)
  WHERE is_primary AND active_until IS NULL;

CREATE INDEX IF NOT EXISTS public_aliases_user_id_idx ON public_aliases (user_id);

-- ---------------------------------------------------------------------------
-- Devices & sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  platform          device_platform NOT NULL DEFAULT 'unknown',
  device_name       TEXT,
  push_token        TEXT,
  app_version       TEXT,
  os_version        TEXT,
  last_seen_at      TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE devices IS 'Registered client installations for push delivery and session binding.';
COMMENT ON COLUMN devices.push_token IS 'Platform push notification token (APNs/FCM/WebPush).';
COMMENT ON COLUMN devices.revoked_at IS 'Set when user logs out or token is invalidated.';

CREATE INDEX IF NOT EXISTS devices_user_id_idx ON devices (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS devices_push_token_unique ON devices (push_token) WHERE push_token IS NOT NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id         UUID REFERENCES devices (id) ON DELETE SET NULL,
  refresh_token_hash TEXT NOT NULL,
  ip_address        INET,
  user_agent        TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at      TIMESTAMPTZ
);

COMMENT ON TABLE sessions IS 'Refresh-token sessions; supports multi-device login and revocation.';
COMMENT ON COLUMN sessions.refresh_token_hash IS 'Hash of opaque refresh token; raw token never stored.';
COMMENT ON COLUMN sessions.device_id IS 'Optional link to the device that created this session.';

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- Social graph
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS friendships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_low       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_id_high      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  initiated_by      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status            friendship_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  CONSTRAINT friendships_ordered_pair CHECK (user_id_low < user_id_high),
  CONSTRAINT friendships_distinct_users CHECK (user_id_low <> user_id_high),
  CONSTRAINT friendships_initiator_is_participant CHECK (
    initiated_by = user_id_low OR initiated_by = user_id_high
  ),
  UNIQUE (user_id_low, user_id_high)
);

COMMENT ON TABLE friendships IS 'Undirected dyadic relationship; canonical ordering prevents duplicate rows.';
COMMENT ON COLUMN friendships.user_id_low IS 'Lower UUID of the pair; enforces single row per friendship.';
COMMENT ON COLUMN friendships.initiated_by IS 'User who sent the friend request.';
COMMENT ON COLUMN friendships.status IS 'pending → accepted/declined; blocked is asymmetric enforcement layer.';

CREATE INDEX IF NOT EXISTS friendships_user_low_idx ON friendships (user_id_low);
CREATE INDEX IF NOT EXISTS friendships_user_high_idx ON friendships (user_id_high);
CREATE INDEX IF NOT EXISTS friendships_status_idx ON friendships (status);

-- ---------------------------------------------------------------------------
-- Communities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS communities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              CITEXT NOT NULL UNIQUE,
  description       TEXT,
  avatar_media_id   UUID, -- FK added after media
  owner_user_id     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  visibility        community_visibility NOT NULL DEFAULT 'public',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at       TIMESTAMPTZ,
  CONSTRAINT communities_name_len CHECK (char_length(name) BETWEEN 1 AND 100)
);

COMMENT ON TABLE communities IS 'Groups/clubs with membership, roles, and optional channels.';
COMMENT ON COLUMN communities.slug IS 'URL-safe unique identifier for the community.';
COMMENT ON COLUMN communities.owner_user_id IS 'Founding owner; transfer tracked via membership role changes.';

CREATE TABLE IF NOT EXISTS community_members (
  community_id      UUID NOT NULL REFERENCES communities (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role              community_member_role NOT NULL DEFAULT 'member',
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at           TIMESTAMPTZ,
  PRIMARY KEY (community_id, user_id)
);

COMMENT ON TABLE community_members IS 'M:N membership with role; left_at NULL means active member.';
COMMENT ON COLUMN community_members.role IS 'Permission tier within the community.';

CREATE INDEX IF NOT EXISTS community_members_user_id_idx ON community_members (user_id);
CREATE INDEX IF NOT EXISTS community_members_active_idx ON community_members (community_id) WHERE left_at IS NULL;

-- ---------------------------------------------------------------------------
-- Locations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label             TEXT,
  latitude          NUMERIC(9, 6) NOT NULL,
  longitude         NUMERIC(9, 6) NOT NULL,
  accuracy_m        NUMERIC(8, 2),
  place_provider    TEXT,
  place_external_id TEXT,
  address_line      TEXT,
  locality          TEXT,
  region            TEXT,
  country_code      CHAR(2),
  postal_code       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT locations_latitude_range CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT locations_longitude_range CHECK (longitude BETWEEN -180 AND 180)
);

COMMENT ON TABLE locations IS 'Normalized geographic points; reusable across messages and stories.';
COMMENT ON COLUMN locations.place_external_id IS 'ID from geocoding provider (Google, Mapbox, etc.).';
COMMENT ON COLUMN locations.accuracy_m IS 'Horizontal accuracy in meters when shared live.';

CREATE INDEX IF NOT EXISTS locations_coords_idx ON locations (latitude, longitude);

-- ---------------------------------------------------------------------------
-- Media
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_user_id  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  storage_bucket    TEXT NOT NULL,
  storage_key       TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  byte_size         BIGINT NOT NULL,
  width_px          INTEGER,
  height_px         INTEGER,
  duration_ms       INTEGER,
  checksum_sha256   TEXT,
  status            media_status NOT NULL DEFAULT 'uploading',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT media_byte_size_positive CHECK (byte_size > 0),
  UNIQUE (storage_bucket, storage_key)
);

COMMENT ON TABLE media IS 'Binary asset metadata; files live in object storage.';
COMMENT ON COLUMN media.storage_key IS 'Object key within storage_bucket.';
COMMENT ON COLUMN media.checksum_sha256 IS 'Integrity verification after upload/processing.';

CREATE INDEX IF NOT EXISTS media_uploader_idx ON media (uploader_user_id);
CREATE INDEX IF NOT EXISTS media_status_idx ON media (status) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_avatar_media_id_fkey') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_avatar_media_id_fkey FOREIGN KEY (avatar_media_id) REFERENCES media (id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communities_avatar_media_id_fkey') THEN
    ALTER TABLE communities ADD CONSTRAINT communities_avatar_media_id_fkey FOREIGN KEY (avatar_media_id) REFERENCES media (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS media_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id          UUID NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  variant_type      media_variant_type NOT NULL,
  storage_bucket    TEXT NOT NULL,
  storage_key       TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  byte_size         BIGINT NOT NULL,
  width_px          INTEGER,
  height_px         INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (media_id, variant_type)
);

COMMENT ON TABLE media_variants IS 'Derived renditions (thumbnails, transcoded video) of a parent media row.';
COMMENT ON COLUMN media_variants.variant_type IS 'Purpose of the derivative file.';

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type conversation_type NOT NULL,
  title             TEXT,
  community_id      UUID REFERENCES communities (id) ON DELETE CASCADE,
  created_by        UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at       TIMESTAMPTZ,
  CONSTRAINT conversations_community_channel_requires_community CHECK (
    (conversation_type = 'community_channel' AND community_id IS NOT NULL)
    OR (conversation_type <> 'community_channel')
  )
);

COMMENT ON TABLE conversations IS 'Chat container for direct, group, or community channel threads.';
COMMENT ON COLUMN conversations.community_id IS 'Required when conversation_type is community_channel.';

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id   UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at           TIMESTAMPTZ,
  last_read_at      TIMESTAMPTZ,
  is_muted          BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE conversation_participants IS 'Users in a conversation; tracks read state and mute per participant.';
COMMENT ON COLUMN conversation_participants.last_read_at IS 'Watermark for unread badge calculation.';

CREATE INDEX IF NOT EXISTS conversation_participants_user_idx ON conversation_participants (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_user_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  reply_to_id       UUID REFERENCES messages (id) ON DELETE SET NULL,
  message_type      message_type NOT NULL DEFAULT 'text',
  body              TEXT,
  location_id       UUID REFERENCES locations (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at         TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT messages_body_or_attachment CHECK (
    body IS NOT NULL
    OR message_type IN ('media', 'location', 'system')
  )
);

COMMENT ON TABLE messages IS 'Individual chat messages; sender NULL for system-generated events.';
COMMENT ON COLUMN messages.reply_to_id IS 'Threading reference within the same conversation.';
COMMENT ON COLUMN messages.location_id IS 'Populated when message_type is location.';

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages (sender_user_id);

CREATE TABLE IF NOT EXISTS message_media (
  message_id        UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  media_id          UUID NOT NULL REFERENCES media (id) ON DELETE RESTRICT,
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (message_id, media_id)
);

COMMENT ON TABLE message_media IS 'M:N junction attaching one or more media files to a message.';

-- ---------------------------------------------------------------------------
-- Stories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  caption           TEXT,
  location_id       UUID REFERENCES locations (id) ON DELETE SET NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT stories_caption_len CHECK (caption IS NULL OR char_length(caption) <= 300)
);

COMMENT ON TABLE stories IS 'Ephemeral story container; items hold slides; expires_at drives TTL.';
COMMENT ON COLUMN stories.expires_at IS 'Typically created_at + 24h; used for cleanup jobs.';

CREATE INDEX IF NOT EXISTS stories_author_created_idx ON stories (author_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories (expires_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS story_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id          UUID NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  media_id          UUID NOT NULL REFERENCES media (id) ON DELETE RESTRICT,
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  duration_ms       INTEGER NOT NULL DEFAULT 5000,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, sort_order)
);

COMMENT ON TABLE story_items IS 'Ordered slides within a story; each references one media asset.';
COMMENT ON COLUMN story_items.duration_ms IS 'Display duration for images; ignored for video length.';

CREATE TABLE IF NOT EXISTS story_views (
  story_id          UUID NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  viewer_user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_user_id)
);

COMMENT ON TABLE story_views IS 'Records which friends/viewers have seen a story.';

CREATE INDEX IF NOT EXISTS story_views_viewer_idx ON story_views (viewer_user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel           notification_channel NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_type, channel)
);

COMMENT ON TABLE notification_preferences IS 'Per-user opt-in/out matrix by event type and delivery channel.';
COMMENT ON COLUMN notification_preferences.notification_type IS 'App-defined key, e.g. friend_request, new_message.';

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  actor_user_id     UUID REFERENCES users (id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title             TEXT,
  body              TEXT,
  payload           JSONB NOT NULL DEFAULT '{}',
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'In-app notification inbox rows; payload holds deep-link context.';
COMMENT ON COLUMN notifications.payload IS 'Structured metadata (entity ids, routes) without duplicating full entities.';
COMMENT ON COLUMN notifications.actor_user_id IS 'User who triggered the notification, if applicable.';

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON notifications (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (recipient_user_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Reports & moderation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  reason_code       TEXT NOT NULL,
  description       TEXT,
  status            report_status NOT NULL DEFAULT 'open',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ
);

COMMENT ON TABLE reports IS 'User-submitted abuse reports; subjects linked in report_subjects.';
COMMENT ON COLUMN reports.reason_code IS 'Controlled vocabulary: spam, harassment, etc.';

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS report_subjects (
  report_id         UUID NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  subject_type      report_subject_type NOT NULL,
  subject_id        UUID NOT NULL,
  PRIMARY KEY (report_id, subject_type, subject_id)
);

COMMENT ON TABLE report_subjects IS 'Polymorphic target of a report; one report may reference multiple subjects.';
COMMENT ON COLUMN report_subjects.subject_id IS 'UUID of the targeted entity; integrity enforced at application layer or via triggers.';

CREATE TABLE IF NOT EXISTS moderation_cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID REFERENCES reports (id) ON DELETE SET NULL,
  subject_type      report_subject_type NOT NULL,
  subject_id        UUID NOT NULL,
  status            moderation_case_status NOT NULL DEFAULT 'open',
  assigned_to       UUID REFERENCES users (id) ON DELETE SET NULL,
  priority          SMALLINT NOT NULL DEFAULT 0,
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ,
  notes             TEXT
);

COMMENT ON TABLE moderation_cases IS 'Moderator workflow queue item tied to a subject and optionally a report.';
COMMENT ON COLUMN moderation_cases.assigned_to IS 'Moderator/admin user handling the case.';

CREATE INDEX IF NOT EXISTS moderation_cases_status_idx ON moderation_cases (status, priority DESC, opened_at);
CREATE INDEX IF NOT EXISTS moderation_cases_subject_idx ON moderation_cases (subject_type, subject_id);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID NOT NULL REFERENCES moderation_cases (id) ON DELETE CASCADE,
  moderator_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  action_type       moderation_action_type NOT NULL,
  reason            TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  effective_until   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE moderation_actions IS 'Immutable audit log of decisions taken on a moderation case.';
COMMENT ON COLUMN moderation_actions.effective_until IS 'End time for time-bound actions (mute, suspend).';
COMMENT ON COLUMN moderation_actions.metadata IS 'Snapshot: content ids removed, message text hash, etc.';

CREATE INDEX IF NOT EXISTS moderation_actions_case_idx ON moderation_actions (case_id);

CREATE TABLE IF NOT EXISTS user_sanctions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  sanction_type     sanction_type NOT NULL,
  source_action_id  UUID NOT NULL REFERENCES moderation_actions (id) ON DELETE RESTRICT,
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at           TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  CONSTRAINT user_sanctions_ends_after_starts CHECK (ends_at IS NULL OR ends_at > starts_at)
);

COMMENT ON TABLE user_sanctions IS 'Active/enforced penalties derived from moderation_actions.';
COMMENT ON COLUMN user_sanctions.ends_at IS 'NULL means permanent (e.g. ban); otherwise time-limited mute/suspend.';
COMMENT ON COLUMN user_sanctions.revoked_at IS 'Set when sanction is lifted early by a moderator.';

CREATE INDEX IF NOT EXISTS user_sanctions_user_revoked_idx ON user_sanctions (user_id)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- Updated-at trigger helper (optional)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS devices_set_updated_at ON devices;
CREATE TRIGGER devices_set_updated_at
  BEFORE UPDATE ON devices FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS friendships_set_updated_at ON friendships;
CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS communities_set_updated_at ON communities;
CREATE TRIGGER communities_set_updated_at
  BEFORE UPDATE ON communities FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS conversations_set_updated_at ON conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON reports FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

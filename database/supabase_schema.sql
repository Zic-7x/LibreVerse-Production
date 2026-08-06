-- ============================================================================
-- SUPABASE STORAGE BUCKETS & DATABASE SCHEMA
-- GamiUnity Application: Posts, Reels, Stories & Media Storage
-- ============================================================================

-- 1. Create Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media', 'media', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('posts', 'posts', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('reels', 'reels', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('stories', 'stories', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects RLS Policies
CREATE POLICY "Public Read Storage" ON storage.objects
  FOR SELECT USING (bucket_id IN ('media', 'posts', 'reels', 'stories', 'avatars'));

CREATE POLICY "Authenticated Upload Storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('media', 'posts', 'reels', 'stories', 'avatars'));

CREATE POLICY "Owner Delete Storage" ON storage.objects
  FOR DELETE USING (auth.uid() = owner);

-- 3. Media Assets Metadata Table
CREATE TABLE IF NOT EXISTS public.media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_user_id  UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  storage_bucket    TEXT NOT NULL DEFAULT 'media',
  storage_key       TEXT NOT NULL,
  public_url        TEXT,
  mime_type         TEXT NOT NULL,
  byte_size         BIGINT NOT NULL,
  width_px          INTEGER,
  height_px         INTEGER,
  duration_ms       INTEGER,
  status            TEXT NOT NULL DEFAULT 'completed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  UNIQUE (storage_bucket, storage_key)
);

-- 4. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  media_id          UUID REFERENCES public.media (id) ON DELETE SET NULL,
  media_url         TEXT NOT NULL,
  is_video          BOOLEAN NOT NULL DEFAULT false,
  caption           TEXT,
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  is_saved          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Reels Table (Videos up to 10 minutes max: 600s limit)
CREATE TABLE IF NOT EXISTS public.reels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  media_id          UUID REFERENCES public.media (id) ON DELETE SET NULL,
  video_url         TEXT NOT NULL,
  thumbnail_url     TEXT,
  audio_track       TEXT DEFAULT 'Original Audio',
  caption           TEXT,
  duration_seconds  INTEGER CHECK (duration_seconds <= 600),
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Stories Table (Videos up to 60s max, 24h default expiration)
CREATE TABLE IF NOT EXISTS public.stories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  caption           TEXT,
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- 7. Story Items Table
CREATE TABLE IF NOT EXISTS public.story_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id          UUID NOT NULL REFERENCES public.stories (id) ON DELETE CASCADE,
  media_id          UUID REFERENCES public.media (id) ON DELETE CASCADE,
  media_url         TEXT NOT NULL,
  is_video          BOOLEAN NOT NULL DEFAULT false,
  duration_seconds  INTEGER DEFAULT 5 CHECK (duration_seconds <= 60),
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Story Views Table
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id          UUID NOT NULL REFERENCES public.stories (id) ON DELETE CASCADE,
  viewer_user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public Read Media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public Read Reels" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Public Read Stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Public Read Story Items" ON public.story_items FOR SELECT USING (true);
CREATE POLICY "Public Read Story Views" ON public.story_views FOR SELECT USING (true);

-- Authenticated Insert Policies
CREATE POLICY "Authenticated Insert Media" ON public.media FOR INSERT WITH CHECK (auth.uid() = uploader_user_id);
CREATE POLICY "Authenticated Insert Posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "Authenticated Insert Reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "Authenticated Insert Stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "Authenticated Insert Story Items" ON public.story_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated Insert Story Views" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_user_id);

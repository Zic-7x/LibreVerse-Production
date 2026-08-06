-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- GamiUnity Application: Storage Buckets & Policies
-- ============================================================================

-- 1. Create Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media', 'media', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('posts', 'posts', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('reels', 'reels', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('stories', 'stories', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('attachments', 'attachments', true, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects Policies (Public Read & Authenticated/Service Role Write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Storage'
  ) THEN
    CREATE POLICY "Public Read Storage" ON storage.objects
      FOR SELECT USING (bucket_id IN ('media', 'posts', 'reels', 'stories', 'avatars', 'attachments'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public/Service Write Storage'
  ) THEN
    CREATE POLICY "Public/Service Write Storage" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id IN ('media', 'posts', 'reels', 'stories', 'avatars', 'attachments'));
  END IF;
END $$;

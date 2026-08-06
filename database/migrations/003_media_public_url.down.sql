-- Migration 003: Remove public_url column from media table
ALTER TABLE media DROP COLUMN IF EXISTS public_url;

-- Migration 003: Add public_url column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS public_url TEXT;

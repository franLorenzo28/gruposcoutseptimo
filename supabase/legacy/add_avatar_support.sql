-- Migration: Add avatar support to profiles
-- This file contains the SQL commands needed to add avatar functionality

-- 1. Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create storage bucket for avatars (run this in Supabase Dashboard -> Storage)
-- Bucket name: avatars
-- Public: true
-- File size limit: 4MB
-- Allowed MIME types: image/*

-- 3. Set up Row Level Security (RLS) policies for avatars bucket
-- (Run these in SQL Editor after creating the bucket)

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars (so they can be displayed)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Note: After running this migration:
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Create a new bucket named "avatars"
-- 3. Make it public
-- 4. Set max file size to 2MB
-- 5. Then run the RLS policies above in the SQL Editor

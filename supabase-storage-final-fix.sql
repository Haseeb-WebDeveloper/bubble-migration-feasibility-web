-- Final Storage Fix - Run this in Supabase SQL Editor
-- This will create the most permissive policies that should work

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop ALL existing policies for storage.objects
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- 3. Create very simple, permissive policies
CREATE POLICY "Allow all authenticated users to upload to user-images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow all authenticated users to update user-images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow all authenticated users to delete user-images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow everyone to view user-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-images');

-- 4. Verify the setup
SELECT 
  'Bucket exists:' as info,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'user-images';

SELECT 
  'Policies created:' as info,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%user-images%';
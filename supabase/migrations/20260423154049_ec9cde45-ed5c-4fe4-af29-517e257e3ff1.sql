-- Remove broad SELECT, keep individual file access via public URL only
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;

-- Re-publishing the bucket as public means individual objects are still
-- accessible via their public URL without an explicit SELECT policy.
-- We do NOT recreate a SELECT policy, which prevents listing.

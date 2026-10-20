-- =============================================================================
-- GymBooking Internal CRM - Migration 005: Storage Buckets & Policies
-- =============================================================================
-- Creates the 'documents' storage bucket and sets up granular RLS policies.
-- =============================================================================

-- 1. Create 'documents' bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 52428800)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 52428800;

-- 2. Storage RLS policies for 'documents' bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_select_policy'
  ) THEN
    CREATE POLICY documents_select_policy ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_insert_policy'
  ) THEN
    CREATE POLICY documents_insert_policy ON storage.objects
      FOR INSERT TO public
      WITH CHECK (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_update_policy'
  ) THEN
    CREATE POLICY documents_update_policy ON storage.objects
      FOR UPDATE TO public
      USING (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_delete_policy'
  ) THEN
    CREATE POLICY documents_delete_policy ON storage.objects
      FOR DELETE TO public
      USING (bucket_id = 'documents');
  END IF;
END $$;

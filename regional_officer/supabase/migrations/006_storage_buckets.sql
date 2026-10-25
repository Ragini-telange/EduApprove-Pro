-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 006: Secure Storage Buckets & Storage Policies
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- NOTE: Execution of storage bucket insertion requires standard Supabase project privileges.
-- Storage buckets are strictly PRIVATE. Public read access is disabled.

-- ----------------------------------------------------------------------------
-- 1. PROVISION PRIVATE STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'application-documents',
        'application-documents',
        false, -- Strictly Private
        26214400, -- 25MB statutory limit per file
        ARRAY['application/pdf', 'image/jpeg', 'image/png']
    ),
    (
        'evc-reports',
        'evc-reports',
        false, -- Strictly Private & Confidential
        26214400, -- 25MB limit
        ARRAY['application/pdf']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. STORAGE POLICIES: 'application-documents'
-- ----------------------------------------------------------------------------
-- Ensure RLS is active on storage.objects

-- Policy 1: Authenticated users can view application documents if authorized
DROP POLICY IF EXISTS "application_documents_read_policy" ON storage.objects;
CREATE POLICY "application_documents_read_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'application-documents'
    AND (
        -- Senior Authority & Super Admin: Nationwide access
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('senior_authority', 'super_admin')
        )
        -- Regional Officer: Access to documents in their jurisdiction states
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.application_documents ad ON ad.storage_path = storage.objects.name
            JOIN public.applications a ON a.id = ad.application_id
            JOIN public.institutions i ON i.id = a.institution_id
            WHERE p.id = auth.uid()
            AND p.role = 'regional_officer'
            AND (i.state = ANY(p.jurisdiction_states) OR i.regional_office = p.regional_office)
        )
        -- Institution Admin: Access to their own institution's uploaded documents
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.application_documents ad ON ad.storage_path = storage.objects.name
            JOIN public.applications a ON a.id = ad.application_id
            WHERE p.id = auth.uid()
            AND p.role = 'institution_admin'
            AND p.institution_id = a.institution_id
        )
    )
);

-- Policy 2: Institution Admins can upload documents ONLY for their own institution's applications
DROP POLICY IF EXISTS "application_documents_insert_policy" ON storage.objects;
CREATE POLICY "application_documents_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'application-documents'
    AND (
        -- Super Admin
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
        -- Institution Admin: Path must correspond to an application owned by user's institution in an active submission state
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.applications a ON (
                a.id::text = (storage.foldername(storage.objects.name))[1]
                OR a.id::text = (storage.foldername(storage.objects.name))[2]
                OR a.institution_id::text = (storage.foldername(storage.objects.name))[1]
            )
            WHERE p.id = auth.uid()
            AND p.role = 'institution_admin'
            AND p.institution_id = a.institution_id
            AND a.status IN ('draft', 'correction_required')
        )
        -- Regional Officer: Can upload official counter-evidence in assigned jurisdiction
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.applications a ON (
                a.id::text = (storage.foldername(storage.objects.name))[1]
                OR a.id::text = (storage.foldername(storage.objects.name))[2]
            )
            JOIN public.institutions i ON i.id = a.institution_id
            WHERE p.id = auth.uid()
            AND p.role = 'regional_officer'
            AND (i.state = ANY(p.jurisdiction_states) OR i.regional_office = p.regional_office)
        )
    )
);

-- ----------------------------------------------------------------------------
-- 3. STORAGE POLICIES: 'evc-reports'
-- Highly confidential committee inspection reports
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "evc_reports_read_policy" ON storage.objects;
CREATE POLICY "evc_reports_read_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'evc-reports'
    AND (
        -- Senior Authorities and Regional Officers can read reports
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('senior_authority', 'regional_officer', 'super_admin')
        )
        -- Institution Admins can ONLY read if disclose_to_institution is true AND not an unannounced visit
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.evc_visits ev ON ev.report_storage_url = storage.objects.name
            JOIN public.applications a ON a.id = ev.application_id
            WHERE p.id = auth.uid()
            AND p.role = 'institution_admin'
            AND p.institution_id = a.institution_id
            AND ev.disclose_to_institution = true
            AND ev.is_unannounced = false
        )
    )
);

DROP POLICY IF EXISTS "evc_reports_insert_policy" ON storage.objects;
CREATE POLICY "evc_reports_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'evc-reports'
    AND (
        -- Senior Authority & Super Admin
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('senior_authority', 'super_admin')
        )
        -- Regional Officer: In jurisdiction
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.applications a ON (
                a.id::text = (storage.foldername(storage.objects.name))[1]
                OR a.id::text = (storage.foldername(storage.objects.name))[2]
            )
            JOIN public.institutions i ON i.id = a.institution_id
            WHERE p.id = auth.uid()
            AND p.role = 'regional_officer'
            AND (i.state = ANY(p.jurisdiction_states) OR i.regional_office = p.regional_office)
        )
    )
);


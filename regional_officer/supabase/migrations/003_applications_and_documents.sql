-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 003: Applications, Documents & Version History
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. APPLICATIONS TABLE
-- Regulatory Approval Application lifecycle
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT NOT NULL UNIQUE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    type application_type NOT NULL,
    academic_year VARCHAR(10) NOT NULL, -- e.g. "2026-2027"
    status application_status NOT NULL DEFAULT 'draft',
    priority priority_level NOT NULL DEFAULT 'normal',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_officer_name TEXT,
    deadline_date DATE NOT NULL,
    deficiency_count INTEGER NOT NULL DEFAULT 0 CHECK (deficiency_count >= 0),
    evc_required BOOLEAN NOT NULL DEFAULT false,
    evc_visit_id UUID, -- Forward reference, formally constrained in migration 004
    re_scrutiny_count INTEGER NOT NULL DEFAULT 0 CHECK (re_scrutiny_count >= 0)
);

-- Trigger for applications updated_at
DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for application queues, officer assignment, and deadline tracking
CREATE INDEX IF NOT EXISTS idx_applications_institution_id ON public.applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_officer ON public.applications(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON public.applications(deadline_date);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_priority ON public.applications(priority);

-- ----------------------------------------------------------------------------
-- 2. APPLICATION DOCUMENTS TABLE
-- Statutory documents uploaded by institutions and scrutinized by Regional Officers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Land & Building',
        'Faculty & HR',
        'Financial & Society',
        'Affiliation & Approvals',
        'Safety & Compliance'
    )),
    code VARCHAR(30) NOT NULL, -- e.g. "DOC-LND-01"
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    file_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    storage_path TEXT NOT NULL, -- Supabase Storage object key in 'application-documents'
    preview_url TEXT,
    status document_verification_status NOT NULL DEFAULT 'pending',
    observations TEXT,
    deficiency_reason TEXT,
    deficiency_remarks TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    ocr_extracted_text TEXT,
    ai_scrutiny_summary TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_updated_in_resubmission BOOLEAN NOT NULL DEFAULT false,
    previous_version_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for documents updated_at
DROP TRIGGER IF EXISTS set_application_documents_updated_at ON public.application_documents;
CREATE TRIGGER set_application_documents_updated_at
    BEFORE UPDATE ON public.application_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes on documents
CREATE INDEX IF NOT EXISTS idx_application_documents_app_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_status ON public.application_documents(status);
CREATE INDEX IF NOT EXISTS idx_application_documents_code ON public.application_documents(code);
CREATE INDEX IF NOT EXISTS idx_application_documents_expiry ON public.application_documents(expiry_date);

-- ----------------------------------------------------------------------------
-- 3. DOCUMENT VERSION HISTORY TABLE
-- Version snapshots for resubmitted documents across scrutiny cycles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.application_documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    status document_verification_status NOT NULL DEFAULT 'pending',
    observations TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    diff_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_doc_version_history_doc_id ON public.document_version_history(document_id);

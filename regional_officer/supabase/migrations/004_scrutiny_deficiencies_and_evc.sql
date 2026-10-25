-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 004: Scrutiny Checklists, Deficiencies, Remarks & EVC Visits
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCRUTINY CHECKLISTS TABLE
-- Configurable APH norm checklist per application type
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scrutiny_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    code VARCHAR(30) NOT NULL, -- e.g. "CHK-NEW-01"
    title TEXT NOT NULL,
    requirement_text TEXT NOT NULL,
    norm_reference TEXT NOT NULL, -- e.g. "AICTE APH 2026-27 Clause 4.2"
    status checklist_compliance_status NOT NULL DEFAULT 'pending',
    officer_notes TEXT,
    associated_doc_codes TEXT[] DEFAULT '{}',
    supporting_evidence TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    previous_review_status checklist_compliance_status,
    previous_review_remarks TEXT,
    application_type application_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_scrutiny_checklists_updated_at ON public.scrutiny_checklists;
CREATE TRIGGER set_scrutiny_checklists_updated_at
    BEFORE UPDATE ON public.scrutiny_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_scrutiny_checklists_app_id ON public.scrutiny_checklists(application_id);
CREATE INDEX IF NOT EXISTS idx_scrutiny_checklists_status ON public.scrutiny_checklists(status);

-- ----------------------------------------------------------------------------
-- 2. SCRUTINY DEFICIENCIES TABLE
-- Formal deficiencies identified by Regional Officers requiring institution rectification
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scrutiny_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.application_documents(id) ON DELETE SET NULL,
    document_name TEXT,
    checklist_item_id UUID REFERENCES public.scrutiny_checklists(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    clause_reference TEXT NOT NULL,
    severity deficiency_severity NOT NULL,
    deficiency_title TEXT NOT NULL,
    detailed_reason TEXT NOT NULL,
    remedial_action_required TEXT NOT NULL,
    rectification_deadline DATE NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_remarks TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    resolution_status deficiency_resolution_status,
    is_draft BOOLEAN NOT NULL DEFAULT true,
    re_scrutiny_cycle INTEGER NOT NULL DEFAULT 1 CHECK (re_scrutiny_cycle >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_scrutiny_deficiencies_updated_at ON public.scrutiny_deficiencies;
CREATE TRIGGER set_scrutiny_deficiencies_updated_at
    BEFORE UPDATE ON public.scrutiny_deficiencies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_deficiencies_app_id ON public.scrutiny_deficiencies(application_id);
CREATE INDEX IF NOT EXISTS idx_deficiencies_severity ON public.scrutiny_deficiencies(severity);
CREATE INDEX IF NOT EXISTS idx_deficiencies_is_draft ON public.scrutiny_deficiencies(is_draft);
CREATE INDEX IF NOT EXISTS idx_deficiencies_is_resolved ON public.scrutiny_deficiencies(is_resolved);

-- ----------------------------------------------------------------------------
-- 3. SCRUTINY REMARKS & STAGE AUDIT TABLE
-- Detailed officer remarks per application stage and transition
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scrutiny_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    officer_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status_from application_status NOT NULL,
    status_to application_status NOT NULL,
    stage TEXT NOT NULL,
    remarks TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scrutiny_remarks_app_id ON public.scrutiny_remarks(application_id);
CREATE INDEX IF NOT EXISTS idx_scrutiny_remarks_officer_id ON public.scrutiny_remarks(officer_id);

-- ----------------------------------------------------------------------------
-- 4. EVC VISITS TABLE
-- Expert Visit Committee scheduling, tracking, and confidential report storage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evc_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    visit_type TEXT NOT NULL CHECK (visit_type IN (
        'Regular Verification',
        'Surprise / Unannounced Visit',
        'Deficiency Re-inspection'
    )),
    status evc_status NOT NULL DEFAULT 'pending_scheduling',
    tentative_date DATE,
    confirmed_date DATE,
    is_unannounced BOOLEAN NOT NULL DEFAULT false,
    lead_officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    lead_officer_name TEXT NOT NULL,
    committee_members JSONB NOT NULL DEFAULT '[]'::jsonb,
    visit_terms TEXT,
    report_submitted_at TIMESTAMPTZ,
    report_summary TEXT,
    outcome_recommendation TEXT CHECK (outcome_recommendation IS NULL OR outcome_recommendation IN (
        'Satisfactory',
        'Deficiencies Found',
        'Severe Violations',
        'Re-visit Recommended'
    )),
    report_storage_url TEXT, -- Path in Supabase Storage 'evc-reports'
    disclose_to_institution BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_evc_visits_updated_at ON public.evc_visits;
CREATE TRIGGER set_evc_visits_updated_at
    BEFORE UPDATE ON public.evc_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_evc_visits_app_id ON public.evc_visits(application_id);
CREATE INDEX IF NOT EXISTS idx_evc_visits_status ON public.evc_visits(status);
CREATE INDEX IF NOT EXISTS idx_evc_visits_lead_officer ON public.evc_visits(lead_officer_id);

-- Formalize constraint from applications.evc_visit_id to evc_visits.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_applications_evc_visit'
    ) THEN
        ALTER TABLE public.applications
        ADD CONSTRAINT fk_applications_evc_visit
        FOREIGN KEY (evc_visit_id) REFERENCES public.evc_visits(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. AI SCRUTINY SUGGESTIONS TABLE (PHASE 7 ASSISTIVE INTELLIGENCE)
-- Advisory-only findings requiring official officer confirmation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_scrutiny_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.application_documents(id) ON DELETE CASCADE,
    document_name TEXT,
    type ai_suggestion_type NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    evidence_quote TEXT,
    source_page INTEGER,
    page_reference TEXT,
    confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    confidence_label TEXT,
    suggested_action TEXT NOT NULL,
    suggested_follow_up TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'pending_review',
    review_state finding_review_status NOT NULL DEFAULT 'pending_review',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    officer_feedback TEXT,
    relevant_checklist_code TEXT,
    relevant_checklist_title TEXT,
    supporting_extracted_text TEXT,
    is_machine_generated BOOLEAN NOT NULL DEFAULT true,
    edited_title TEXT,
    edited_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_app_id ON public.ai_scrutiny_suggestions(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_doc_id ON public.ai_scrutiny_suggestions(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_review_state ON public.ai_scrutiny_suggestions(review_state);

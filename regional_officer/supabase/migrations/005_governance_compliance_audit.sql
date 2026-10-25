-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 005: Governance, Compliance, Late Requests, Notifications & Audit
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COMPLIANCE REQUIREMENTS TABLE
-- Institutional statutory compliance, certificates, fire NOCs, building stability
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    clause TEXT NOT NULL,
    description TEXT NOT NULL,
    mandatory_document_required BOOLEAN NOT NULL DEFAULT true,
    due_date DATE NOT NULL,
    status compliance_status NOT NULL DEFAULT 'pending',
    submitted_document_name TEXT,
    submitted_document_url TEXT,
    submitted_at TIMESTAMPTZ,
    document_expiry_date DATE,
    is_renewal_due_soon BOOLEAN NOT NULL DEFAULT false,
    escalation_level TEXT NOT NULL DEFAULT 'none' CHECK (escalation_level IN ('none', 'warning', 'critical_overdue')),
    officer_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_compliance_requirements_updated_at ON public.compliance_requirements;
CREATE TRIGGER set_compliance_requirements_updated_at
    BEFORE UPDATE ON public.compliance_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_compliance_institution_id ON public.compliance_requirements(institution_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON public.compliance_requirements(status);
CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON public.compliance_requirements(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_doc_expiry ON public.compliance_requirements(document_expiry_date);

-- ----------------------------------------------------------------------------
-- 2. LATE SUBMISSION REQUESTS TABLE
-- Formal requests for condonation of scrutiny delays or late submissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.late_submission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'Late Submission Permission',
        'Condonation of Scrutiny Delay',
        'Emergency Re-application'
    )),
    reason_category TEXT NOT NULL CHECK (reason_category IN (
        'Natural Calamity',
        'Technical Gateway Failure',
        'Administrative Exigency',
        'Judicial Order'
    )),
    detailed_reason TEXT NOT NULL,
    supporting_doc_name TEXT,
    supporting_doc_url TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status late_request_status NOT NULL DEFAULT 'pending_review',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    reviewer_remarks TEXT,
    statutory_disclaimer TEXT NOT NULL DEFAULT 'Accepting for processing does not grant an official exemption or waiver to AICTE Approval Process Handbook norms.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_late_submission_requests_updated_at ON public.late_submission_requests;
CREATE TRIGGER set_late_submission_requests_updated_at
    BEFORE UPDATE ON public.late_submission_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_late_requests_app_id ON public.late_submission_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_late_requests_status ON public.late_submission_requests(status);

-- ----------------------------------------------------------------------------
-- 3. IN-APP NOTIFICATIONS & ALERTS TABLE
-- Targeted role-based alerts for deadlines, assignments, escalations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role user_role NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category notification_category NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'info',
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    application_number TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    action_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON public.app_notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.app_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.app_notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. IMMUTABLE AUDIT LEDGER TABLE
-- Regulatory audit trail of every status transition, scrutiny decision & action
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    application_number TEXT NOT NULL,
    actor_id UUID NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role user_role NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    affected_record TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT NOT NULL,
    remarks TEXT NOT NULL,
    ip_address TEXT,
    source audit_event_source NOT NULL DEFAULT 'REGIONAL_OFFICER_PORTAL',
    origin audit_event_origin NOT NULL DEFAULT 'official_regulatory'
);

-- Strict Immutability Rule: Forbid UPDATE and DELETE on audit_ledger
CREATE OR REPLACE FUNCTION public.enforce_audit_ledger_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL REGULATORY VIOLATION: The AICTE regulatory audit ledger is strictly append-only. UPDATE and DELETE actions are prohibited.';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_ledger_immutable ON public.audit_ledger;
CREATE TRIGGER trg_audit_ledger_immutable
    BEFORE UPDATE OR DELETE ON public.audit_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_ledger_immutability();

-- Anti-Forgery Rule: Automatically bind authenticated actor_id and server-side timestamp
CREATE OR REPLACE FUNCTION public.enforce_audit_ledger_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    verified_role public.user_role;
BEGIN
    -- Server-side timestamp is strictly authoritative
    NEW.timestamp := timezone('utc'::text, now());

    -- If executed through Supabase authenticated client context
    IF auth.uid() IS NOT NULL THEN
        NEW.actor_id := auth.uid();
        
        -- Derive role strictly from verified JWT claim or database profile
        IF (auth.jwt() -> 'app_metadata' ->> 'role') IS NOT NULL THEN
            BEGIN
                NEW.actor_role := (auth.jwt() -> 'app_metadata' ->> 'role')::public.user_role;
            EXCEPTION WHEN OTHERS THEN
                SELECT role INTO verified_role FROM public.profiles WHERE id = auth.uid();
                NEW.actor_role := COALESCE(verified_role, 'institution_admin'::public.user_role);
            END;
        ELSE
            SELECT role INTO verified_role FROM public.profiles WHERE id = auth.uid();
            NEW.actor_role := COALESCE(verified_role, 'institution_admin'::public.user_role);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_ledger_defaults ON public.audit_ledger;
CREATE TRIGGER trg_audit_ledger_defaults
    BEFORE INSERT ON public.audit_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_ledger_defaults();

CREATE INDEX IF NOT EXISTS idx_audit_ledger_app_id ON public.audit_ledger(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_actor_id ON public.audit_ledger(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_timestamp ON public.audit_ledger(timestamp DESC);

-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 007: Comprehensive Row-Level Security (RLS) & Server-Side RBAC
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRUSTED SERVER-SIDE AUTHORIZATION HELPER FUNCTIONS
-- Extracts verified regulatory role and context from auth.uid() & profiles
-- NEVER trusts client-supplied query/body parameters
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    claim_role TEXT;
    db_role user_role;
BEGIN
    -- First check verified JWT app_metadata claim (tamper-proof)
    claim_role := (auth.jwt() -> 'app_metadata' ->> 'role');
    IF claim_role IS NOT NULL AND claim_role IN ('institution_admin', 'regional_officer', 'senior_authority', 'super_admin') THEN
        RETURN claim_role::user_role;
    END IF;

    -- Fallback to database profile lookup
    SELECT role INTO db_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(db_role, 'institution_admin'::user_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    inst_id UUID;
BEGIN
    SELECT institution_id INTO inst_id FROM public.profiles WHERE id = auth.uid();
    RETURN inst_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_regional_officer_in_jurisdiction(inst_state TEXT, inst_region TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    usr_role user_role;
    user_states TEXT[];
    user_office TEXT;
BEGIN
    usr_role := public.current_user_role();
    
    -- Senior Authority and Super Admin have nationwide regulatory oversight
    IF usr_role IN ('senior_authority', 'super_admin') THEN
        RETURN TRUE;
    END IF;

    IF usr_role <> 'regional_officer' THEN
        RETURN FALSE;
    END IF;

    SELECT jurisdiction_states, regional_office 
    INTO user_states, user_office
    FROM public.profiles 
    WHERE id = auth.uid();

    IF inst_state = ANY(user_states) OR inst_region = user_office THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Restrict function execution strictly to authenticated sessions and internal service role
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_user_institution_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_institution_id() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_regional_officer_in_jurisdiction(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_regional_officer_in_jurisdiction(TEXT, TEXT) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW-LEVEL SECURITY ON ALL PUBLIC TABLES
-- Default-Deny: No access unless explicitly permitted by policy
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrutiny_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrutiny_deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrutiny_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evc_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_submission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scrutiny_suggestions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Anti-Recursion: Use direct auth.uid() check and read officer claims from JWT
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated
USING (
    -- User sees their own profile
    id = auth.uid()
    -- Regional Officers & Senior Authorities can view officer profiles
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('regional_officer', 'senior_authority', 'super_admin')
);

-- Anti-Privilege Escalation: Users cannot alter role, institution_id, jurisdiction_states, or regional_office
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    AND (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        OR (
            -- Protected regulatory attributes cannot be modified by user
            role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
            AND institution_id IS NOT DISTINCT FROM (SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid())
            AND jurisdiction_states IS NOT DISTINCT FROM (SELECT p.jurisdiction_states FROM public.profiles p WHERE p.id = auth.uid())
            AND regional_office IS NOT DISTINCT FROM (SELECT p.regional_office FROM public.profiles p WHERE p.id = auth.uid())
        )
    )
);


-- ----------------------------------------------------------------------------
-- 4. INSTITUTIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "institutions_select_policy" ON public.institutions;
CREATE POLICY "institutions_select_policy" ON public.institutions FOR SELECT TO authenticated
USING (
    -- Senior Authority / Super Admin: Nationwide
    public.current_user_role() IN ('senior_authority', 'super_admin')
    -- Regional Officer: Institutions within territorial jurisdiction
    OR public.is_regional_officer_in_jurisdiction(state, regional_office)
    -- Institution Admin: Only their bound institution
    OR id = public.current_user_institution_id()
);

DROP POLICY IF EXISTS "institutions_update_policy" ON public.institutions;
CREATE POLICY "institutions_update_policy" ON public.institutions FOR UPDATE TO authenticated
USING (
    public.current_user_role() IN ('senior_authority', 'super_admin')
    OR id = public.current_user_institution_id()
);

-- ----------------------------------------------------------------------------
-- 5. APPLICATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
CREATE POLICY "applications_select_policy" ON public.applications FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('senior_authority', 'super_admin')
    OR institution_id = public.current_user_institution_id()
    OR EXISTS (
        SELECT 1 FROM public.institutions i
        WHERE i.id = applications.institution_id
        AND public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
    )
);

DROP POLICY IF EXISTS "applications_insert_institution" ON public.applications;
CREATE POLICY "applications_insert_institution" ON public.applications FOR INSERT TO authenticated
WITH CHECK (
    -- Institution Admins can insert draft applications for their own institution
    public.current_user_role() = 'institution_admin'
    AND institution_id = public.current_user_institution_id()
    AND status = 'draft'
);

DROP POLICY IF EXISTS "applications_update_policy" ON public.applications;
CREATE POLICY "applications_update_policy" ON public.applications FOR UPDATE TO authenticated
USING (
    -- Senior Authorities can update any application
    public.current_user_role() IN ('senior_authority', 'super_admin')
    -- Regional Officers can update applications in their jurisdiction
    OR (
        public.current_user_role() = 'regional_officer'
        AND EXISTS (
            SELECT 1 FROM public.institutions i
            WHERE i.id = applications.institution_id
            AND public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
        )
    )
    -- Institution Admins can only edit their application in draft or correction_required states
    OR (
        public.current_user_role() = 'institution_admin'
        AND institution_id = public.current_user_institution_id()
        AND status IN ('draft', 'correction_required')
    )
)
WITH CHECK (
    -- Senior Authorities can update any application
    public.current_user_role() IN ('senior_authority', 'super_admin')
    -- Regional Officers can update applications in their jurisdiction
    OR (
        public.current_user_role() = 'regional_officer'
        AND EXISTS (
            SELECT 1 FROM public.institutions i
            WHERE i.id = applications.institution_id
            AND public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
        )
    )
    -- Institution Admins can update their own application resulting in draft, submitted, correction_required, or resubmitted
    OR (
        public.current_user_role() = 'institution_admin'
        AND institution_id = public.current_user_institution_id()
        AND status IN ('draft', 'submitted', 'correction_required', 'resubmitted')
    )
);

-- ----------------------------------------------------------------------------
-- 6. APPLICATION DOCUMENTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "documents_select_policy" ON public.application_documents;
CREATE POLICY "documents_select_policy" ON public.application_documents FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.institutions i ON i.id = a.institution_id
        WHERE a.id = application_documents.application_id
        AND (
            a.institution_id = public.current_user_institution_id()
            OR public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
        )
    )
);

DROP POLICY IF EXISTS "documents_insert_policy" ON public.application_documents;
CREATE POLICY "documents_insert_policy" ON public.application_documents FOR INSERT TO authenticated
WITH CHECK (
    -- Institution Admins can insert documents for their own applications
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_documents.application_id
        AND a.institution_id = public.current_user_institution_id()
        AND a.status IN ('draft', 'correction_required')
    )
    OR public.current_user_role() IN ('regional_officer', 'super_admin')
);

DROP POLICY IF EXISTS "documents_update_policy" ON public.application_documents;
CREATE POLICY "documents_update_policy" ON public.application_documents FOR UPDATE TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_documents.application_id
        AND a.institution_id = public.current_user_institution_id()
        AND a.status IN ('draft', 'correction_required')
    )
);

-- ----------------------------------------------------------------------------
-- 6.1 DOCUMENT VERSION HISTORY POLICIES
-- Append-only version history tracking institutional document changes
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "version_history_select_policy" ON public.document_version_history;
CREATE POLICY "version_history_select_policy" ON public.document_version_history FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.application_documents ad
        JOIN public.applications a ON a.id = ad.application_id
        JOIN public.institutions i ON i.id = a.institution_id
        WHERE ad.id = document_version_history.document_id
        AND (
            a.institution_id = public.current_user_institution_id()
            OR public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
        )
    )
);

DROP POLICY IF EXISTS "version_history_insert_policy" ON public.document_version_history;
CREATE POLICY "version_history_insert_policy" ON public.document_version_history FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.application_documents ad
        JOIN public.applications a ON a.id = ad.application_id
        JOIN public.institutions i ON i.id = a.institution_id
        WHERE ad.id = document_version_history.document_id
        AND (
            (
                public.current_user_role() = 'institution_admin'
                AND a.institution_id = public.current_user_institution_id()
                AND a.status IN ('draft', 'correction_required')
            )
            OR (
                public.current_user_role() = 'regional_officer'
                AND public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
            )
            OR public.current_user_role() IN ('senior_authority', 'super_admin')
        )
    )
);

-- ----------------------------------------------------------------------------
-- 7. SCRUTINY CHECKLISTS & DEFICIENCIES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklists_select_policy" ON public.scrutiny_checklists;
CREATE POLICY "checklists_select_policy" ON public.scrutiny_checklists FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = scrutiny_checklists.application_id
        AND a.institution_id = public.current_user_institution_id()
    )
);

DROP POLICY IF EXISTS "checklists_manage_policy" ON public.scrutiny_checklists;
CREATE POLICY "checklists_manage_policy" ON public.scrutiny_checklists FOR ALL TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

DROP POLICY IF EXISTS "deficiencies_select_policy" ON public.scrutiny_deficiencies;
CREATE POLICY "deficiencies_select_policy" ON public.scrutiny_deficiencies FOR SELECT TO authenticated
USING (
    -- Officers see all deficiencies including drafts
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    -- Institutions only see officially issued deficiencies (NEVER drafts)
    OR (
        is_draft = false
        AND EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = scrutiny_deficiencies.application_id
            AND a.institution_id = public.current_user_institution_id()
        )
    )
);

DROP POLICY IF EXISTS "deficiencies_manage_policy" ON public.scrutiny_deficiencies;
CREATE POLICY "deficiencies_manage_policy" ON public.scrutiny_deficiencies FOR ALL TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

-- ----------------------------------------------------------------------------
-- 7.1 SCRUTINY REMARKS POLICIES
-- Official officer remarks per application stage and transition (append-only)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "scrutiny_remarks_select_policy" ON public.scrutiny_remarks;
CREATE POLICY "scrutiny_remarks_select_policy" ON public.scrutiny_remarks FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.institutions i ON i.id = a.institution_id
        WHERE a.id = scrutiny_remarks.application_id
        AND (
            a.institution_id = public.current_user_institution_id()
            OR public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
        )
    )
);

DROP POLICY IF EXISTS "scrutiny_remarks_insert_policy" ON public.scrutiny_remarks;
CREATE POLICY "scrutiny_remarks_insert_policy" ON public.scrutiny_remarks FOR INSERT TO authenticated
WITH CHECK (
    -- Only authorized Regional Officers and Senior Authorities can record official scrutiny remarks
    officer_id = auth.uid()
    AND (
        public.current_user_role() IN ('senior_authority', 'super_admin')
        OR (
            public.current_user_role() = 'regional_officer'
            AND EXISTS (
                SELECT 1 FROM public.applications a
                JOIN public.institutions i ON i.id = a.institution_id
                WHERE a.id = scrutiny_remarks.application_id
                AND public.is_regional_officer_in_jurisdiction(i.state, i.regional_office)
            )
        )
    )
);

-- ----------------------------------------------------------------------------
-- 8. EVC VISITS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "evc_visits_select_policy" ON public.evc_visits;
CREATE POLICY "evc_visits_select_policy" ON public.evc_visits FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR (
        disclose_to_institution = true
        AND is_unannounced = false
        AND EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = evc_visits.application_id
            AND a.institution_id = public.current_user_institution_id()
        )
    )
);

DROP POLICY IF EXISTS "evc_visits_manage_policy" ON public.evc_visits;
CREATE POLICY "evc_visits_manage_policy" ON public.evc_visits FOR ALL TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

-- ----------------------------------------------------------------------------
-- 9. COMPLIANCE & LATE REQUESTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "compliance_select_policy" ON public.compliance_requirements;
CREATE POLICY "compliance_select_policy" ON public.compliance_requirements FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR institution_id = public.current_user_institution_id()
);

DROP POLICY IF EXISTS "compliance_update_policy" ON public.compliance_requirements;
CREATE POLICY "compliance_update_policy" ON public.compliance_requirements FOR UPDATE TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR institution_id = public.current_user_institution_id()
);

DROP POLICY IF EXISTS "late_requests_select_policy" ON public.late_submission_requests;
CREATE POLICY "late_requests_select_policy" ON public.late_submission_requests FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = late_submission_requests.application_id
        AND a.institution_id = public.current_user_institution_id()
    )
);

DROP POLICY IF EXISTS "late_requests_insert_policy" ON public.late_submission_requests;
CREATE POLICY "late_requests_insert_policy" ON public.late_submission_requests FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = late_submission_requests.application_id
        AND a.institution_id = public.current_user_institution_id()
    )
);

DROP POLICY IF EXISTS "late_requests_update_policy" ON public.late_submission_requests;
CREATE POLICY "late_requests_update_policy" ON public.late_submission_requests FOR UPDATE TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_policy" ON public.app_notifications;
CREATE POLICY "notifications_select_policy" ON public.app_notifications FOR SELECT TO authenticated
USING (
    recipient_id = auth.uid()
    OR (recipient_id IS NULL AND recipient_role = public.current_user_role())
);

DROP POLICY IF EXISTS "notifications_update_policy" ON public.app_notifications;
CREATE POLICY "notifications_update_policy" ON public.app_notifications FOR UPDATE TO authenticated
USING (
    recipient_id = auth.uid()
    OR (recipient_id IS NULL AND recipient_role = public.current_user_role())
);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LEDGER POLICIES
-- Append-Only: INSERT allowed for authenticated events; UPDATE & DELETE denied
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_ledger_select_policy" ON public.audit_ledger;
CREATE POLICY "audit_ledger_select_policy" ON public.audit_ledger FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
    OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = audit_ledger.application_id
        AND a.institution_id = public.current_user_institution_id()
    )
);

DROP POLICY IF EXISTS "audit_ledger_insert_policy" ON public.audit_ledger;
CREATE POLICY "audit_ledger_insert_policy" ON public.audit_ledger FOR INSERT TO authenticated
WITH CHECK (
    actor_id = auth.uid()
    AND actor_role = public.current_user_role()
);

-- Note: No UPDATE or DELETE policy exists for public.audit_ledger
-- In addition, the database trigger trg_audit_ledger_immutable enforces immutability at the engine level.

-- ----------------------------------------------------------------------------
-- 12. AI SUGGESTIONS POLICIES (ASSISTIVE INTELLIGENCE)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "ai_suggestions_select_policy" ON public.ai_scrutiny_suggestions;
CREATE POLICY "ai_suggestions_select_policy" ON public.ai_scrutiny_suggestions FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

DROP POLICY IF EXISTS "ai_suggestions_manage_policy" ON public.ai_scrutiny_suggestions;
CREATE POLICY "ai_suggestions_manage_policy" ON public.ai_scrutiny_suggestions FOR ALL TO authenticated
USING (
    public.current_user_role() IN ('regional_officer', 'senior_authority', 'super_admin')
);

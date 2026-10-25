-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 001: Statutory Enums & Database Extensions
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- Safe Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USER ROLES (STRICT AICTE REGULATORY ROLES)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'institution_admin',  -- College Principal / Trust Signatory (Sakshi)
            'regional_officer',   -- Regional Officer (Ragini)
            'senior_authority',   -- AICTE Bureau Head / Advisor / Chairman (Janhavi)
            'super_admin'         -- System Administrator
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. APPLICATION LIFECYCLE STATUS (CANONICAL 12-STATE STATUTORY WORKFLOW)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM (
            'draft',
            'submitted',
            'under_scrutiny',
            'correction_required',
            'resubmitted',
            'under_re_scrutiny',
            'pending_evc',
            'evc_scheduled',
            'under_next_stage',
            'completed',
            'rejected',
            'withdrawn'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. APPLICATION & SCRUTINY DOMAIN ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_type') THEN
        CREATE TYPE application_type AS ENUM (
            'new_institution',
            'extension_of_approval',
            'increase_in_intake',
            'closure_of_course',
            'change_of_site',
            'conversion_of_women_inst'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM (
            'normal',
            'urgent',
            'critical'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_verification_status') THEN
        CREATE TYPE document_verification_status AS ENUM (
            'pending',
            'verified',
            'correction_required',
            'rejected'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_compliance_status') THEN
        CREATE TYPE checklist_compliance_status AS ENUM (
            'pending',
            'compliant',
            'non_compliant',
            'not_applicable'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deficiency_severity') THEN
        CREATE TYPE deficiency_severity AS ENUM (
            'minor',
            'major',
            'fatal'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deficiency_resolution_status') THEN
        CREATE TYPE deficiency_resolution_status AS ENUM (
            'resolved',
            'still_outstanding',
            'requires_further_review'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. EVC, COMPLIANCE & GOVERNANCE ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evc_status') THEN
        CREATE TYPE evc_status AS ENUM (
            'not_required',
            'required',
            'pending_scheduling',
            'scheduled',
            'evc_scheduled',
            'visit_completed',
            'completed',
            'report_submitted',
            'cancelled'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_status') THEN
        CREATE TYPE compliance_status AS ENUM (
            'pending',
            'submitted',
            'verified',
            'correction_required',
            'overdue'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'late_request_status') THEN
        CREATE TYPE late_request_status AS ENUM (
            'pending_review',
            'accepted_for_processing',
            'not_accepted',
            'more_info_required'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category') THEN
        CREATE TYPE notification_category AS ENUM (
            'deadline',
            'overdue',
            'assignment',
            'resubmission',
            'evc_report',
            'compliance',
            'document_expiry',
            'late_request',
            'escalation'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM (
            'info',
            'warning',
            'urgent',
            'critical'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_event_source') THEN
        CREATE TYPE audit_event_source AS ENUM (
            'REGIONAL_OFFICER_PORTAL',
            'SYSTEM_ENGINE',
            'INSTITUTION_PORTAL',
            'EVC_COMMITTEE',
            'BUREAU_API'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_event_origin') THEN
        CREATE TYPE audit_event_origin AS ENUM (
            'official_regulatory',
            'simulated_demo'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_suggestion_type') THEN
        CREATE TYPE ai_suggestion_type AS ENUM (
            'missing_field',
            'metadata_mismatch',
            'unreadable_scan',
            'norm_non_compliance',
            'deficiency_draft'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finding_review_status') THEN
        CREATE TYPE finding_review_status AS ENUM (
            'pending_review',
            'confirmed',
            'edited',
            'dismissed'
        );
    END IF;
END $$;

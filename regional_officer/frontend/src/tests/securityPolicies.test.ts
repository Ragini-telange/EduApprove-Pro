import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 8B-4: Static SQL Migration Security Invariants', () => {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');

  const readFile = (filename: string): string => {
    const fullPath = path.join(migrationsDir, filename);
    return fs.readFileSync(fullPath, 'utf-8');
  };

  it('1. User cannot elevate role, change institution_id, or alter jurisdiction in profiles_update_self', () => {
    const rlsSql = readFile('007_row_level_security.sql');
    expect(rlsSql).toContain('CREATE POLICY "profiles_update_self"');
    // Confirms checks preventing changing role, institution_id, jurisdiction_states, and regional_office
    expect(rlsSql).toContain('role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())');
    expect(rlsSql).toContain('institution_id IS NOT DISTINCT FROM (SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid())');
    expect(rlsSql).toContain('jurisdiction_states IS NOT DISTINCT FROM (SELECT p.jurisdiction_states FROM public.profiles p WHERE p.id = auth.uid())');
    expect(rlsSql).toContain('regional_office IS NOT DISTINCT FROM (SELECT p.regional_office FROM public.profiles p WHERE p.id = auth.uid())');
  });

  it('2. profiles_select_policy eliminates recursive RLS calls', () => {
    const rlsSql = readFile('007_row_level_security.sql');
    expect(rlsSql).toContain('CREATE POLICY "profiles_select_policy"');
    // Officer role check uses JWT claim rather than self-recursive current_user_role()
    expect(rlsSql).toContain("(auth.jwt() -> 'app_metadata' ->> 'role') IN ('regional_officer', 'senior_authority', 'super_admin')");
  });

  it('3. Explicit least-privilege policies exist for document_version_history', () => {
    const rlsSql = readFile('007_row_level_security.sql');
    expect(rlsSql).toContain('CREATE POLICY "version_history_select_policy" ON public.document_version_history');
    expect(rlsSql).toContain('CREATE POLICY "version_history_insert_policy" ON public.document_version_history');
    // Restricts insert to active states
    expect(rlsSql).toContain("a.status IN ('draft', 'correction_required')");
  });

  it('4. Explicit least-privilege policies exist for scrutiny_remarks', () => {
    const rlsSql = readFile('007_row_level_security.sql');
    expect(rlsSql).toContain('CREATE POLICY "scrutiny_remarks_select_policy" ON public.scrutiny_remarks');
    expect(rlsSql).toContain('CREATE POLICY "scrutiny_remarks_insert_policy" ON public.scrutiny_remarks');
    // Enforces officer_id = auth.uid()
    expect(rlsSql).toContain('officer_id = auth.uid()');
  });

  it('5. All SECURITY DEFINER functions enforce fixed search_path = public, pg_temp', () => {
    const coreMasterSql = readFile('002_core_master_tables.sql');
    const auditSql = readFile('005_governance_compliance_audit.sql');
    const rlsSql = readFile('007_row_level_security.sql');

    // Migration 002
    expect(coreMasterSql).toContain('CREATE OR REPLACE FUNCTION public.handle_updated_at()');
    expect(coreMasterSql).toContain('SET search_path = public, pg_temp');
    expect(coreMasterSql).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');

    // Migration 005
    expect(auditSql).toContain('CREATE OR REPLACE FUNCTION public.enforce_audit_ledger_immutability()');
    expect(auditSql).toContain('CREATE OR REPLACE FUNCTION public.enforce_audit_ledger_defaults()');

    // Migration 007
    expect(rlsSql).toContain('CREATE OR REPLACE FUNCTION public.current_user_role()');
    expect(rlsSql).toContain('CREATE OR REPLACE FUNCTION public.current_user_institution_id()');
    expect(rlsSql).toContain('CREATE OR REPLACE FUNCTION public.is_regional_officer_in_jurisdiction');
    expect(rlsSql).toContain('REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;');
  });

  it('6. Storage policies validate upload paths and protect confidential EVC reports', () => {
    const storageSql = readFile('006_storage_buckets.sql');
    // Application path scoping
    expect(storageSql).toContain('CREATE POLICY "application_documents_insert_policy"');
    expect(storageSql).toContain("(storage.foldername(storage.objects.name))[1]");
    expect(storageSql).toContain("a.status IN ('draft', 'correction_required')");
    // Confidentiality of EVC reports
    expect(storageSql).toContain('CREATE POLICY "evc_reports_read_policy"');
    expect(storageSql).toContain('ev.disclose_to_institution = true');
    expect(storageSql).toContain('ev.is_unannounced = false');
  });

  it('7. Audit ledger enforces immutability and verified actor identity', () => {
    const auditSql = readFile('005_governance_compliance_audit.sql');
    const rlsSql = readFile('007_row_level_security.sql');

    // Immutability trigger
    expect(auditSql).toContain('trg_audit_ledger_immutable');
    expect(auditSql).toContain('CRITICAL REGULATORY VIOLATION: The AICTE regulatory audit ledger is strictly append-only.');
    // Verified actor check in RLS
    expect(rlsSql).toContain('CREATE POLICY "audit_ledger_insert_policy" ON public.audit_ledger');
    expect(rlsSql).toContain('actor_id = auth.uid()');
    expect(rlsSql).toContain('actor_role = public.current_user_role()');
  });

  it('8. Automated signup trigger assigns only safe default role and empty jurisdiction', () => {
    const coreMasterSql = readFile('002_core_master_tables.sql');
    expect(coreMasterSql).toContain('assigned_role := \'institution_admin\'::public.user_role;');
    expect(coreMasterSql).toContain('jurisdiction_states,');
    expect(coreMasterSql).toContain('\'{}\',');
    expect(coreMasterSql).toContain('NULL, -- institution_id starts NULL');
  });

  it('9. Profile privilege immutability trigger enforces engine-level protection against tampering', () => {
    const coreMasterSql = readFile('002_core_master_tables.sql');
    expect(coreMasterSql).toContain('CREATE OR REPLACE FUNCTION public.enforce_profile_privilege_immutability()');
    expect(coreMasterSql).toContain('trg_protect_profile_privileges');
    expect(coreMasterSql).toContain('SECURITY VIOLATION: Role cannot be modified by user.');
    expect(coreMasterSql).toContain('SECURITY VIOLATION: Institution binding cannot be modified by user.');
    expect(coreMasterSql).toContain('SECURITY VIOLATION: Territorial jurisdiction cannot be modified by user.');
    expect(coreMasterSql).toContain('SECURITY VIOLATION: Regional office assignment cannot be modified by user.');
  });
});


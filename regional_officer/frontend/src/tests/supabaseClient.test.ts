import { describe, it, expect } from 'vitest';
import { checkSupabaseHealth, supabase } from '../services/supabaseClient';

describe('Phase 8B-1: Supabase Client SDK Initialization & Safeguards', () => {
  it('exports an authoritative Supabase client instance and health checker', () => {
    expect(checkSupabaseHealth).toBeDefined();
    // supabase is either a SupabaseClient instance (when env is set) or null
    expect(supabase !== undefined).toBe(true);
  });

  it('reports non-destructive health status without crashing', () => {
    const health = checkSupabaseHealth();
    expect(health).toHaveProperty('isConfigured');
    expect(health).toHaveProperty('isAvailable');
    // Live database availability must be false since schema is not migrated yet
    expect(health.isAvailable).toBe(false);
  });

  it('does not expose secret credentials in health check output', () => {
    const health = checkSupabaseHealth();
    const serialized = JSON.stringify(health);
    // Ensure no anon key or service role key is contained in output
    expect(serialized).not.toContain('anon');
    expect(serialized).not.toContain('eyJhbGciOi');
  });
});

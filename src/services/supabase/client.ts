import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

// ============================================================================
// AICTE SMARTASSIST — AUTHORITATIVE SINGLETON SUPABASE CLIENT
// ============================================================================

export interface SupabaseHealth {
  isConfigured: boolean;
  isAvailable: boolean;
  isClientInitialized: boolean;
  url?: string;
  errorReason?: string;
}

const env: any = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl = (env.VITE_SUPABASE_URL || 'https://wsdmvjmhxbaxrdhfyuwm.supabase.co').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nOt9How7HfpSkcjkGJYqsw_HBvk9fqW').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseAnonKey.includes('your-anon-key')
);

function createAuthoritativeClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'aicte_smartassist_supabase_auth',
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = createAuthoritativeClient();

export function checkSupabaseHealth(): SupabaseHealth {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isConfigured: false,
      isAvailable: false,
      isClientInitialized: false,
      errorReason: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is undefined in environment variables.',
    };
  }

  if (supabaseUrl.includes('your-supabase-url') || supabaseAnonKey.includes('your-anon-key')) {
    return {
      isConfigured: false,
      isAvailable: false,
      isClientInitialized: false,
      url: supabaseUrl,
      errorReason: 'Environment variables contain dummy placeholder keys.',
    };
  }

  const clientReady = supabase !== null;

  return {
    isConfigured: true,
    isAvailable: clientReady,
    isClientInitialized: clientReady,
    url: supabaseUrl,
    errorReason: clientReady
      ? 'Supabase client operational.'
      : 'Failed to initialize Supabase SDK client.',
  };
}

/**
 * Helper to get the current Supabase session
 */
export async function getSupabaseSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      return null;
    }
    return data?.session || null;
  } catch (err) {
    console.warn('getSupabaseSession exception:', err);
    return null;
  }
}

/**
 * Helper to get the current Supabase user
 */
export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Supabase getUser error:', error.message);
      return null;
    }
    return data?.user || null;
  } catch (err) {
    console.warn('getSupabaseUser exception:', err);
    return null;
  }
}

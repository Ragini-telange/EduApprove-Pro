import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION & RESILIENT HEALTH CHECK
// ============================================================================

export interface SupabaseHealth {
  isConfigured: boolean;
  isAvailable: boolean;
  isClientInitialized?: boolean;
  url?: string;
  errorReason?: string;
}

const env: any = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl = (env.VITE_SUPABASE_URL || 'https://wsdmvjmhxbaxrdhfyuwm.supabase.co').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nOt9How7HfpSkcjkGJYqsw_HBvk9fqW').trim();

/**
 * Initializes the Supabase client safely without crashing if credentials
 * are missing, empty, or dummy placeholders.
 */
function initializeSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const trimmedUrl = supabaseUrl.trim();
  const trimmedKey = supabaseAnonKey.trim();

  if (
    trimmedUrl === '' ||
    trimmedKey === '' ||
    trimmedUrl.includes('your-supabase-url') ||
    trimmedKey.includes('your-anon-key')
  ) {
    return null;
  }

  try {
    return createClient(trimmedUrl, trimmedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (_err) {
    // Graceful error trap without logging credential values
    return null;
  }
}

/**
 * Authoritative Supabase client instance.
 * Evaluates to `null` if environment variables are not configured.
 */
export const supabase: SupabaseClient | null = initializeSupabaseClient();

/**
 * Non-destructive health check assessing whether credentials exist
 * and whether the SDK client has been initialized.
 *
 * NOTE: Live database connectivity is not verified here because
 * live schema tables have not yet been migrated.
 */
export function checkSupabaseHealth(): SupabaseHealth {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isConfigured: false,
      isAvailable: false,
      isClientInitialized: false,
      errorReason: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is undefined in environment variables.',
    };
  }

  const trimmedUrl = supabaseUrl.trim();
  const trimmedKey = supabaseAnonKey.trim();

  if (trimmedUrl === '' || trimmedKey === '') {
    return {
      isConfigured: false,
      isAvailable: false,
      isClientInitialized: false,
      errorReason: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is empty in environment variables.',
    };
  }

  if (trimmedUrl.includes('your-supabase-url') || trimmedKey.includes('your-anon-key')) {
    return {
      isConfigured: false,
      isAvailable: false,
      isClientInitialized: false,
      url: trimmedUrl,
      errorReason: 'Environment variables contain dummy placeholder keys.',
    };
  }

  const clientReady = supabase !== null;

  return {
    isConfigured: true,
    isAvailable: false, // Live connectivity remains unverified until database schema migration
    isClientInitialized: clientReady,
    url: trimmedUrl,
    errorReason: clientReady
      ? 'Supabase client initialized. Running in Mock Mode until live database schema is migrated.'
      : 'Supabase client failed to initialize with provided configuration.',
  };
}


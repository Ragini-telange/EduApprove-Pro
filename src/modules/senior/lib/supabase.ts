import { supabase as authoritativeClient, isSupabaseConfigured as authoritativeConfigured } from '../../../services/supabase/client';

export const isSupabaseConfigured = authoritativeConfigured;
export const supabase = authoritativeClient;

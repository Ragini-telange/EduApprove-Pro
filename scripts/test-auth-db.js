import { supabase, isSupabaseConfigured } from '../src/services/supabase/client';

async function main() {
  console.log('--- SUPABASE CONFIGURATION ---');
  console.log('isSupabaseConfigured:', isSupabaseConfigured);

  if (!supabase) {
    console.log('Supabase client is null!');
    return;
  }

  console.log('\n--- TESTING DATABASE TABLES ---');
  try {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
    console.log('profiles query:', { count: profiles?.length, data: profiles, error: pError?.message, code: pError?.code, details: pError?.details });
  } catch (e) {
    console.log('profiles exception:', e);
  }

  try {
    const { data: users, error: uError } = await supabase.from('users').select('*').limit(5);
    console.log('users query:', { count: users?.length, error: uError?.message, code: uError?.code });
  } catch (e) {
    console.log('users exception:', e);
  }

  console.log('\n--- TESTING SUPABASE AUTH SIGN IN ---');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'principal@pict.edu',
      password: 'demo123'
    });
    console.log('signInWithPassword result:', {
      user: authData?.user?.id,
      email: authData?.user?.email,
      meta: authData?.user?.user_metadata,
      appMeta: authData?.user?.app_metadata,
      error: authError?.message,
      status: authError?.status
    });
  } catch (e) {
    console.log('signIn exception:', e);
  }
  console.log('\n--- TESTING SUPABASE AUTH SIGN IN WITH PREVIOUSLY CREATED USER ---');
  try {
    const { data: testSignIn, error: testErr } = await supabase.auth.signInWithPassword({
      email: 'aicte.test.1792935702231@gmail.com',
      password: 'TestPassword123!'
    });
    console.log('signIn for aicte.test result:', {
      userId: testSignIn?.user?.id,
      email: testSignIn?.user?.email,
      session: !!testSignIn?.session,
      metadata: testSignIn?.user?.user_metadata,
      error: testErr?.message,
      status: testErr?.status
    });
  } catch (e) {
    console.log('signIn exception:', e);
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

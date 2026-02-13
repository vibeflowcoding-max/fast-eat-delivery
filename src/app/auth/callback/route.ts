import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check if profile exists (for OAuth users)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        // Create profile if missing
        const { error: insertError } = await supabase.from('user_profiles').insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          role_id: 'c8dd43d7-1070-470d-ac58-d01f8dae8511', // Delivery role ID
        });

        if (insertError) {
          console.error('Error creating user profile in callback:', insertError);
          // Still redirect, but maybe to a profile setup page or just show an error
        }
      }

      const next = searchParams.get('next') || '/orders';
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

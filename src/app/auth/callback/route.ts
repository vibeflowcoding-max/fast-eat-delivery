import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard/feed';

  // Determine the correct origin
  // On Render, request.url might contain localhost:10000.
  // We use headers to get the original host and protocol from the proxy.
  const host = request.headers.get('x-forwarded-host') || requestUrl.host;
  const proto = request.headers.get('x-forwarded-proto') || (requestUrl.protocol.startsWith('https') ? 'https' : 'http');
  const origin = `${proto}://${host}`;

  console.log('Auth Callback Debug:', {
    requestUrl: request.url,
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    resolvedOrigin: origin,
    next
  });

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
        }
      }

      console.log('Redirecting to:', `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    if (error) {
      console.error('Auth error in callback:', error);
    }
  }

  // If there's an error, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

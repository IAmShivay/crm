import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      if (data.user) {
        // Check if this is a new user (first time social login)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();

        // Check if user has workspaces
        const { data: workspaces } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', data.user.id)
          .eq('status', 'active');

        // If new user or no profile/workspace, redirect to setup
        if (!profile?.full_name || !workspaces?.length) {
          return NextResponse.redirect(new URL('/auth/setup', request.url));
        }
      }

      // Successful authentication with existing profile
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', request.url)
      );
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=Authentication failed', request.url));
  }
}

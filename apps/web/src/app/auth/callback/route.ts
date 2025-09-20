import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback route handler for Supabase authentication
 *
 * Handles the OAuth callback after user authentication. Exchanges the
 * authorization code for a session and redirects users based on their
 * onboarding status.
 *
 * @param request - The incoming HTTP request
 * @returns Redirect response to appropriate page
 *
 * @example
 * OAuth flow:
 * 1. User clicks login -> redirected to auth provider
 * 2. User authenticates -> redirected back with code
 * 3. This route exchanges code for session
 * 4. Redirects to /onboarding (new users) or /dashboard (existing users)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin))
    }

    // Check if user has completed onboarding
    const userId = session?.user?.id
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single()

      const hasCompletedOnboarding = profile?.onboarding_completed || false

      // If new user or hasn't completed onboarding, redirect to onboarding
      if (!hasCompletedOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  // If onboarding is complete or no user, redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}

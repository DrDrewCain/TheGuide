import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    // Check if user has completed onboarding
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
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

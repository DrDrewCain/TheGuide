import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Next.js middleware for authentication and onboarding flow control
 *
 * This middleware handles:
 * - Authentication checks for protected routes
 * - Onboarding status verification and routing
 * - Session refresh for expired tokens
 * - Performance optimization via cookie caching
 *
 * Flow:
 * 1. Check authentication status
 * 2. For authenticated users, check onboarding completion
 * 3. Redirect based on auth and onboarding status
 *
 * @param request - The incoming HTTP request
 * @returns Response with appropriate redirects or pass-through
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set({ name, value }))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Check onboarding status for authenticated users
  if (user) {
    // Try to get onboarding status from cookie for performance
    let hasCompletedOnboarding: boolean
    const onboardingCookie = request.cookies.get('onboarding_completed')

    if (onboardingCookie) {
      hasCompletedOnboarding = onboardingCookie.value === 'true'
    } else {
      // Get user profile to check onboarding status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      hasCompletedOnboarding = profile?.onboarding_completed || false
    }

    // Cookie options for consistency
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day cache
    }

    // Helper function to create redirect with cookie
    const createRedirectWithCookie = (url: URL) => {
      const redirect = NextResponse.redirect(url)
      redirect.cookies.set({
        name: 'onboarding_completed',
        value: hasCompletedOnboarding.toString(),
        ...cookieOptions,
      })
      return redirect
    }

    // Set cookie on the response if we fetched from DB
    if (!onboardingCookie) {
      response.cookies.set({
        name: 'onboarding_completed',
        value: hasCompletedOnboarding.toString(),
        ...cookieOptions,
      })
    }

    // Check if user needs onboarding when accessing dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard') && !hasCompletedOnboarding) {
      return createRedirectWithCookie(new URL('/onboarding', request.url))
    }

    // If user completed onboarding, don't let them go back
    if (request.nextUrl.pathname === '/onboarding' && hasCompletedOnboarding) {
      return createRedirectWithCookie(new URL('/dashboard', request.url))
    }

    // Redirect from auth page based on onboarding status
    if (request.nextUrl.pathname === '/auth') {
      if (!hasCompletedOnboarding) {
        return createRedirectWithCookie(new URL('/onboarding', request.url))
      } else {
        return createRedirectWithCookie(new URL('/dashboard', request.url))
      }
    }
  }

  // Allow access to onboarding only for logged in users
  if (request.nextUrl.pathname === '/onboarding' && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

/**
 * Middleware configuration
 *
 * Specifies which routes should be processed by the middleware.
 * Excludes static assets and Next.js internal routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

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
    // Get user profile to check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const hasCompletedOnboarding = profile?.onboarding_completed || false

    // Check if user needs onboarding when accessing dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard') && !hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // If user completed onboarding, don't let them go back
    if (request.nextUrl.pathname === '/onboarding' && hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect from auth page based on onboarding status
    if (request.nextUrl.pathname === '/auth') {
      if (!hasCompletedOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // Allow access to onboarding only for logged in users
  if (request.nextUrl.pathname === '/onboarding' && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

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

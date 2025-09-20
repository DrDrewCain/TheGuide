import { NextResponse } from 'next/server'

/**
 * API endpoint to check if a user with the given email already exists
 *
 * Since Supabase automatically handles duplicate email prevention during signup,
 * this endpoint is primarily for UX improvement to provide immediate feedback
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // For now, we'll rely on Supabase's built-in duplicate prevention
    // during the actual signup process. This endpoint can be enhanced
    // later if we get access to service role keys for admin operations

    // Return false to allow the signup flow to continue
    // Supabase will handle the actual duplicate check
    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('Error in check-user route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
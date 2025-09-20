import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to check if a user with the given email already exists
 * Returns explicit status to enable proper UX flow (redirect to login, show forgot password)
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Create Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists using admin client
    const { data: users, error } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      // Try alternative approach - list users with email filter
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        console.error('Error checking user existence:', authError)
        return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
      }

      const exists = authData.users.some(user => user.email?.toLowerCase() === email.toLowerCase())
      return NextResponse.json({ exists }, { status: 200 })
    }

    const exists = users && users.length > 0
    return NextResponse.json({ exists }, { status: 200 })
  } catch (error) {
    console.error('Error in check-user route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForm } from '../auth-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

describe('AuthForm - Duplicate Registration Prevention', () => {
  const mockSupabase = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Issue #29: Prevent duplicate user registrations', () => {
    it('should check if user exists before attempting registration', async () => {
      const user = userEvent.setup()
      const existingEmail = 'existing@example.com'

      // Mock check-user endpoint returns exists: true
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true })
      })

      render(<AuthForm />)

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), existingEmail)
      await user.type(screen.getByLabelText(/password/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Verify check-user endpoint was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: existingEmail })
        })
      })

      // Verify signUp was NOT called
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()

      // Verify error message is displayed
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument()

      // Verify form switches to signin mode
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should redirect to signin with forgot password hint when duplicate detected', async () => {
      const user = userEvent.setup()
      const existingEmail = 'existing@example.com'

      // Mock check-user endpoint returns exists: true
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true })
      })

      render(<AuthForm />)

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), existingEmail)
      await user.type(screen.getByLabelText(/password/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        // Verify form switches to signin mode
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()

        // Verify forgot password link is visible
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
      })
    })

    it('should proceed with registration if user does not exist', async () => {
      const user = userEvent.setup()
      const newEmail = 'new@example.com'

      // Mock check-user endpoint returns exists: false
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      })

      // Mock successful signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: '123', email: newEmail, confirmed_at: null }
        },
        error: null
      })

      render(<AuthForm />)

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), newEmail)
      await user.type(screen.getByLabelText(/password/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        // Verify check-user endpoint was called first
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail })
        })

        // Verify signUp was called
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: newEmail,
          password: 'password123',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback')
          }
        })
      })

      // Verify success message
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })

    it('should continue with signup if check-user endpoint fails', async () => {
      const user = userEvent.setup()
      const email = 'test@example.com'

      // Mock check-user endpoint failure
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Mock signup attempt
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' }
      })

      render(<AuthForm />)

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), email)
      await user.type(screen.getByLabelText(/password/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        // Verify signUp was still attempted
        expect(mockSupabase.auth.signUp).toHaveBeenCalled()

        // Verify error is handled gracefully
        expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument()
      })
    })

    it('should handle Supabase duplicate user error as fallback', async () => {
      const user = userEvent.setup()
      const email = 'existing@example.com'

      // Mock check-user endpoint returns false (user doesn't exist)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      })

      // But Supabase returns duplicate error
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' }
      })

      render(<AuthForm />)

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), email)
      await user.type(screen.getByLabelText(/password/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        // Verify error message is displayed
        expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument()

        // Verify form switches to signin mode
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      })
    })
  })
})

describe('Check-User API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 with exists: true for existing users', async () => {
    const response = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@example.com' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({ exists: true })
  })

  it('should return 200 with exists: false for new users', async () => {
    const response = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({ exists: false })
  })

  it('should return 400 for missing email', async () => {
    const response = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toEqual({ error: 'Email is required' })
  })

  it('should return 400 for invalid email format', async () => {
    const response = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' })
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toEqual({ error: 'Invalid email format' })
  })
})
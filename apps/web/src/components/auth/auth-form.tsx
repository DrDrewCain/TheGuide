'use client'

import { Button } from '@theguide/ui'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'signin' | 'signup'

/**
 * Authentication form component for sign in and sign up
 *
 * Handles user registration with duplicate email prevention
 * and proper error messaging
 */
export function AuthForm({ initialMode }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Handle forgot password flow
   */
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setMessage('Check your email for a password reset link!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        // Check if user already exists before attempting signup
        try {
          const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })

          const checkData = await response.json()

          if (checkData.exists) {
            setError('An account with this email already exists. Please sign in instead.')
            setMode('signin')
            return
          }
        } catch (checkError) {
          console.error('Error checking user:', checkError)
          // Continue with signup attempt even if check fails
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          // Handle specific Supabase errors
          if (
            error.message.includes('User already registered') ||
            error.message.includes('already been registered') ||
            error.message.toLowerCase().includes('already exists')
          ) {
            setError('An account with this email already exists. Please sign in instead.')
            setMode('signin')
            return
          }

          if (error.message.includes('Invalid email')) {
            setError('Please enter a valid email address.')
            return
          }

          if (error.message.includes('Password should be at least')) {
            setError('Password must be at least 6 characters long.')
            return
          }

          throw error
        }

        // Check if a user was created but email wasn't sent (indicates existing user)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please sign in instead.')
          setMode('signin')
          return
        }

        // Check if email confirmation is required
        if (data.user && !data.user.confirmed_at) {
          setMessage('Check your email to confirm your account!')
        } else if (data.user) {
          // If auto-confirm is enabled, redirect to dashboard
          window.location.href = '/dashboard'
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email before signing in. Check your inbox.')
          } else {
            throw error
          }
          return
        }

        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>{error}</div>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>{message}</div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>

        <div className="space-y-2">
          <p className="text-center text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setMessage(null)
                  }}
                  className="text-slate-700 font-medium hover:text-slate-900 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                    setMessage(null)
                  }}
                  className="text-slate-700 font-medium hover:text-slate-900 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {mode === 'signin' && (
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={() => handleForgotPassword()}
                className="text-slate-700 font-medium hover:text-slate-900 transition-colors"
              >
                Forgot your password?
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

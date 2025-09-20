'use client'

import { Button, Modal, Input, Label } from '@theguide/ui'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

type AuthMode = 'signin' | 'signup'

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<AuthMode>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setEmail('')
            setPassword('')
            setError(null)
            setMessage(null)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                // If user is returned, they can login immediately (email confirmation disabled)
                if (data.user) {
                    onSuccess?.()
                    onClose()
                } else {
                    // Email confirmation is required
                    setMessage('Check your email to confirm your account!')
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                onSuccess?.()
                onClose()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
                )}

                {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>
                )}

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder=""
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Button>

                <p className="text-center text-sm text-gray-600">
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setMode('signup')}
                                className="text-blue-600 hover:underline"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setMode('signin')}
                                className="text-blue-600 hover:underline"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </p>
            </form>
        </Modal>
    )
}
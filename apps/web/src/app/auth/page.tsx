'use client'

import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthPageContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') as 'signin' | 'signup' | null
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">TheGuide</h1>
            <p className="text-slate-600 mt-2">Make better decisions with data</p>
          </div>
          <AuthForm initialMode={mode || 'signin'} />
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-slate-700 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-slate-700 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
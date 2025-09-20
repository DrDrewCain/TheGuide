'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@theguide/ui'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LogOut, Menu, X, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check initial auth state
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-slate-900 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <header
        className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60"
        role="banner"
      >
        <nav
          className="container-responsive py-4"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <Link
              href="/"
              className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded-md"
              aria-label="TheGuide - Home"
            >
              <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl font-black text-slate-900">T</span>
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:inline">TheGuide</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
                </div>
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[200px] truncate">{user.email}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                    aria-label="Log out of your account"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/auth">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Log in to your account"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth?mode=signup">
                    <Button
                      variant="primary"
                      size="sm"
                      aria-label="Sign up for a new account"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-700" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden mt-4 border-t border-slate-200 pt-4"
              >
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-10 bg-slate-200 rounded-md"></div>
                    <div className="h-10 bg-slate-200 rounded-md"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 p-2">
                      <UserIcon className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2"
                      aria-label="Log out of your account"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        aria-label="Log in to your account"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        aria-label="Sign up for a new account"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </>
  )
}
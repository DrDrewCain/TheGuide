import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/providers/auth-provider'
import { MagneticCursor } from '@theguide/ui'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TheGuide - AI Life Decision Simulator',
  description: 'Make informed life decisions with AI-powered simulations based on real data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MagneticCursor>
          <AuthProvider>{children}</AuthProvider>
        </MagneticCursor>
      </body>
    </html>
  )
}

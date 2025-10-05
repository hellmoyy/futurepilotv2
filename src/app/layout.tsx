import type { Metadata } from 'next'
import { Rajdhani } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

export const metadata: Metadata = {
  title: 'FuturePilot - AI-Powered Trading Automation',
  description: 'Advanced AI-powered trading automation platform for cryptocurrency and forex markets. Trade smarter with cutting-edge artificial intelligence.',
}

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={rajdhani.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
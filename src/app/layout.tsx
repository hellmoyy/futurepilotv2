import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
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
    <html lang="en" className="dark">
      <body className={roboto.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
import type { Metadata, Viewport } from 'next'
import { Libre_Baskerville, Courier_Prime } from 'next/font/google'
import './globals.css'
import { ThemeRoot } from '@/components/ThemeRoot'
import { Particles } from '@/components/Particles'
import { GameSync } from '@/lib/cloud/GameSync'

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
  display: 'swap',
})

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-courier',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Project Remus — the game master in your pocket',
  description:
    'Host Mafia and Werewolf for 5–20 players. Project Remus handles the roles, the night order and the rules, and tells you exactly what to say and play.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Project Remus' },
}

export const viewport: Viewport = {
  themeColor: '#08080c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="millersHollow" className={`${baskerville.variable} ${courierPrime.variable}`}>
      <body className="tex-grain vhs-scan">
        <ThemeRoot>
          <GameSync />
          <Particles />
          <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
            {children}
          </div>
        </ThemeRoot>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Libre_Baskerville, Courier_Prime } from 'next/font/google'
import './globals.css'
import { ThemeRoot } from '@/components/ThemeRoot'
import { Particles } from '@/components/Particles'
import { GameSync } from '@/lib/cloud/GameSync'
import { BottomNav, BottomNavSpacer } from '@/components/BottomNav'
import { StoreHydrator } from '@/components/StoreHydrator'
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  softwareAppJsonLd,
  faqJsonLd,
} from '@/lib/seo'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Werewolf & Mafia game master app`,
    // Sub-pages set only their own title; this appends the brand.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: 'games',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE_NAME },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Werewolf & Mafia game master app`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE_NAME}: ${SITE_TAGLINE}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Werewolf & Mafia game master app`,
    description: SITE_DESCRIPTION,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
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
      <head>
        {/*
          JSON-LD is the structured-data channel Google actually documents and
          uses, unlike the keywords meta tag. This is what can turn a plain
          blue link into a rich result with an FAQ dropdown.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
        />
      </head>
      <body className="tex-grain vhs-scan">
        <ThemeRoot>
          <StoreHydrator />
          <GameSync />
          <Particles />
          <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
            {children}
            <BottomNavSpacer />
          </div>
          <BottomNav />
        </ThemeRoot>
      </body>
    </html>
  )
}

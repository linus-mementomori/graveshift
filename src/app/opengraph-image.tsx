import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

/**
 * The social preview card, generated at build time.
 *
 * Deliberately not a screenshot of the app: the app is a near-black screen with
 * three words on it, which makes a terrible thumbnail. This says what the thing
 * is, which is what a link preview is for.
 */
/** Required by `output: 'export'`. The PNG is rendered once at build time. */
export const dynamic = 'force-static'

export const alt = `${SITE_NAME}: a Werewolf and Mafia game master in your pocket`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          background: 'linear-gradient(135deg, #0e0e14 0%, #16161f 60%, #241416 100%)',
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#6e6e80',
          }}
        >
          {SITE_TAGLINE}
        </div>

        <div
          style={{
            fontSize: 108,
            fontStyle: 'italic',
            fontWeight: 700,
            color: '#cf5a53',
            marginTop: 18,
            letterSpacing: -2,
          }}
        >
          {SITE_NAME.toUpperCase()}
        </div>

        <div
          style={{
            fontSize: 34,
            color: '#f2f2f7',
            marginTop: 26,
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Host Werewolf &amp; Mafia for 5–20 players. It deals the roles, runs the night order, and
          tells you what to say.
        </div>

        <div
          style={{
            display: 'flex',
            gap: 18,
            marginTop: 44,
            fontSize: 22,
            color: '#a8a8b8',
          }}
        >
          <span>Free</span>
          <span style={{ color: '#3a3a48' }}>·</span>
          <span>No sign-up to play</span>
          <span style={{ color: '#3a3a48' }}>·</span>
          <span>Works offline</span>
        </div>
      </div>
    ),
    size,
  )
}

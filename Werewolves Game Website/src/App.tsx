import { useState, useEffect, useRef } from 'react'

/* ── floating Upside-Down particles ── */
function Particles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`,
    duration: `${8 + Math.random() * 10}s`,
    size: `${1 + Math.random() * 2.5}px`,
    opacity: 0.3 + Math.random() * 0.5,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: '#cc4444',
            boxShadow: '0 0 4px #ff0000',
            animation: `float-particle ${p.duration} ${p.delay} infinite linear`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
}

/* ── Christmas lights string ── */
function LightsString({ colors }: { colors: string[] }) {
  const [on, setOn] = useState<boolean[]>(colors.map(() => true))
  useEffect(() => {
    const interval = setInterval(() => {
      setOn((prev) => prev.map((v) => (Math.random() > 0.08 ? true : !v)))
    }, 600)
    return () => clearInterval(interval)
  }, [])
  return (
    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-end', padding: '0.5rem 0' }}>
      {colors.map((color, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          {/* wire stub */}
          <div style={{ width: '1px', height: '12px', background: '#333' }} />
          {/* bulb */}
          <div
            style={{
              width: '10px',
              height: '14px',
              borderRadius: '50% 50% 40% 40%',
              background: on[i] ? color : '#1a0a0a',
              boxShadow: on[i] ? `0 0 6px ${color}, 0 0 14px ${color}` : 'none',
              transition: 'box-shadow 0.15s, background 0.15s',
            }}
          />
        </div>
      ))}
    </div>
  )
}

const LIGHT_COLORS = [
  '#ff2222', '#ff8800', '#ffdd00', '#22ff44',
  '#4488ff', '#cc22ff', '#ff2222', '#ff8800',
  '#ffdd00', '#22ff44', '#4488ff', '#cc22ff',
  '#ff2222', '#ff8800', '#ffdd00', '#22ff44',
  '#4488ff', '#cc22ff', '#ff2222', '#ff8800',
]

const roles = [
  {
    name: 'Werewolf',
    icon: '🐺',
    team: 'evil' as const,
    tag: 'THE MONSTER',
    description:
      'Every night, the wolves wake and choose a victim. By day they walk among the innocent, casting doubt and blame. They win when they equal the living villagers.',
    ability: 'Night Kill',
  },
  {
    name: 'Villager',
    icon: '🏠',
    team: 'good' as const,
    tag: 'THE PARTY',
    description:
      'Armed only with suspicion and a vote. Discuss, argue, accuse — then eliminate one suspect each day. Trust is a luxury you cannot afford.',
    ability: 'Vote',
  },
  {
    name: 'Seer',
    icon: '🔮',
    team: 'good' as const,
    tag: 'ELEVEN',
    description:
      'Gifted with sight beyond sight. Each night, peek at one player\'s true nature. Reveal too early and the wolves will silence you before dawn.',
    ability: 'Night Vision',
  },
  {
    name: 'Witch',
    icon: '⚗️',
    team: 'good' as const,
    tag: 'THE ALCHEMIST',
    description:
      'Two potions. One saves a life. One ends one. Each may only be used once per game. The timing of your mercy or malice will decide everything.',
    ability: 'Save & Poison',
  },
  {
    name: 'Hunter',
    icon: '🏹',
    team: 'good' as const,
    tag: 'HOPPER',
    description:
      'When the Hunter falls — wolf\'s fang or village vote — they fire one last shot. Drag an enemy with you into the dark. Do not go quietly.',
    ability: 'Last Shot',
  },
  {
    name: 'Alpha Wolf',
    icon: '🌑',
    team: 'evil' as const,
    tag: 'THE MIND FLAYER',
    description:
      'Leader of the pack. Once per game the Alpha may corrupt a villager, turning them wolf. The hive mind grows. The village shrinks.',
    ability: 'Convert',
  },
]

const steps = [
  {
    num: '01',
    label: 'ASSEMBLE',
    title: 'Gather the Group',
    body: 'You need 8–18 players and a Moderator. The Moderator deals role cards face-down. No one speaks. No one shows. The village does not yet know its own monsters.',
    bulb: '#ff2222',
  },
  {
    num: '02',
    label: 'NIGHT',
    title: 'The Village Sleeps',
    body: 'All players close their eyes. The Moderator calls roles one by one. Wolves choose a victim. Special roles use their powers in silence. The darkness does its work.',
    bulb: '#cc22ff',
  },
  {
    num: '03',
    label: 'DAWN',
    title: 'What Was Lost',
    body: 'Everyone opens their eyes. The Moderator announces who was taken in the night. Their card is revealed. Now comes the reckoning.',
    bulb: '#ff8800',
  },
  {
    num: '04',
    label: 'VOTE',
    title: 'Accuse and Eliminate',
    body: 'The village debates. Anyone can accuse anyone. When the argument ends, everyone votes. The player with the most votes is eliminated — their card revealed to all.',
    bulb: '#22ff44',
  },
  {
    num: '05',
    label: 'SURVIVE',
    title: 'Who Wins?',
    body: 'Villagers win by eliminating every last wolf. Wolves win when they equal or outnumber the living villagers. Night falls again. And again. Until one side falls.',
    bulb: '#4488ff',
  },
]

const faqs = [
  {
    q: 'How many players do you need?',
    a: 'The sweet spot is 10–15. Fewer than 8 and deduction collapses; more than 18 and chaos takes over. The base game scales best between 10 and 14 players.',
  },
  {
    q: 'How long does a game take?',
    a: 'Typically 30–60 minutes. Some games end in 20 minutes when a wolf makes a fatal slip. Others stretch past an hour when paranoia paralyzes the village.',
  },
  {
    q: 'Do you need cards or equipment?',
    a: 'Just role cards — print them, write them on slips, or use an app. A darkened room helps. Some groups use a flashlight for night phases. Nothing else required.',
  },
  {
    q: 'What happens when you\'re eliminated?',
    a: 'You reveal your card and watch in silence. No hints, no gestures. The dead keep all secrets. Some groups allow one final anonymous whisper per ghost — use your judgment.',
  },
]

export default function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const heroRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // power-on glow after mount
    const el = heroRef.current
    if (el) {
      el.style.opacity = '0'
      setTimeout(() => {
        el.style.transition = 'opacity 0.1s'
        el.style.opacity = '1'
      }, 300)
    }
  }, [])

  return (
    <div style={{ background: '#0a0208', minHeight: '100vh', position: 'relative' }}>
      <Particles />

      {/* ── Nav ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2.5rem',
          background: 'linear-gradient(to bottom, rgba(10,2,8,0.97), transparent)',
        }}
      >
        <span
          className="font-display glow-red animate-flicker-soft"
          style={{ fontSize: '1rem', letterSpacing: '0.2em' }}
        >
          WEREWOLVES
        </span>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {['Roles', 'How to Play', 'FAQ'].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{
                color: '#7a5a5a',
                fontFamily: "'Courier Prime', monospace",
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textDecoration: 'none',
                transition: 'color 0.2s, text-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.color = '#ff3333'
                el.style.textShadow = '0 0 8px rgba(255,0,0,0.6)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.color = '#7a5a5a'
                el.style.textShadow = 'none'
              }}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '6rem 2rem 4rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* background radial */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(180,0,0,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Christmas lights */}
        <div style={{ marginBottom: '3rem' }}>
          <LightsString colors={LIGHT_COLORS} />
        </div>

        <p
          style={{
            fontFamily: "'Courier Prime', monospace",
            color: '#cc4444',
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            marginBottom: '2rem',
          }}
        >
          — HAWKINS, INDIANA —
        </p>

        <h1
          ref={heroRef}
          className="font-display glow-title animate-pulse-glow"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 9rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.01em',
            marginBottom: '0.5rem',
            fontWeight: 700,
            fontStyle: 'italic',
          }}
        >
          WERE
          <br />
          WOLVES
        </h1>

        <p
          style={{
            fontFamily: "'Courier Prime', monospace",
            color: '#7a5a5a',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            margin: '1.5rem 0 2.5rem',
          }}
        >
          A SOCIAL DEDUCTION GAME FOR THE BRAVE
        </p>

        <p
          style={{
            maxWidth: '500px',
            color: '#b09090',
            fontSize: '1rem',
            lineHeight: 1.75,
            fontStyle: 'italic',
            marginBottom: '3rem',
          }}
        >
          The lights are flickering. One of your neighbors did not come home last night.
          Someone in this room is not what they seem.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#how-to-play" className="cta-btn">LEARN TO PLAY</a>
          <a href="#roles" className="cta-btn-secondary">VIEW ROLES</a>
        </div>

        {/* scroll hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span style={{ fontFamily: "'Courier Prime', monospace", color: '#3a2222', fontSize: '0.65rem', letterSpacing: '0.2em' }}>
            SCROLL
          </span>
          <div style={{ width: '1px', height: '30px', background: 'linear-gradient(to bottom, #3a2222, transparent)' }} />
        </div>
      </section>

      {/* ── Tape static divider ── */}
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #cc0000 20%, #ff4444 50%, #cc0000 80%, transparent 100%)',
          boxShadow: '0 0 12px rgba(204,0,0,0.6)',
          position: 'relative',
          zIndex: 2,
        }}
      />

      {/* ── Intro pull quote ── */}
      <section
        style={{
          padding: '6rem 2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          background: 'linear-gradient(to bottom, #0a0208, #0d0308)',
        }}
      >
        <blockquote
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            fontSize: 'clamp(1.15rem, 3vw, 1.6rem)',
            fontFamily: "'Libre Baskerville', serif",
            fontStyle: 'italic',
            color: '#cc8888',
            lineHeight: 1.6,
          }}
        >
          "The village went to sleep peacefully. It woke to find one of its own
          devoured — and no one knew who to blame."
        </blockquote>
        <div
          style={{
            width: '60px',
            height: '1px',
            background: '#cc0000',
            boxShadow: '0 0 8px #cc0000',
            margin: '2.5rem auto 0',
          }}
        />
      </section>

      {/* ── Roles ── */}
      <section id="roles" style={{ padding: '6rem 2rem', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p
              style={{
                fontFamily: "'Courier Prime', monospace",
                color: '#cc0000',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                marginBottom: '1rem',
                textShadow: '0 0 8px rgba(204,0,0,0.5)',
              }}
            >
              // HAWKINS LAB DOSSIER //
            </p>
            <h2
              className="font-display glow-soft"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontStyle: 'italic', marginBottom: '1.5rem' }}
            >
              Roles of the Village
            </h2>
            <div className="divider-red" />
            <p style={{ color: '#7a5a5a', maxWidth: '460px', margin: '0 auto', fontSize: '0.95rem' }}>
              One card. One role. Keep it secret. Everyone is lying — including you.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {roles.map((role) => (
              <div
                key={role.name}
                className={`role-card team-${role.team}`}
                style={{ padding: '2rem', borderRadius: '2px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.2rem' }}>{role.icon}</span>
                  <span
                    style={{
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      color: role.team === 'evil' ? '#cc0000' : '#29b6f6',
                      border: `1px solid ${role.team === 'evil' ? '#660000' : '#0277bd'}`,
                      padding: '0.2rem 0.6rem',
                      textShadow: role.team === 'evil' ? '0 0 6px rgba(204,0,0,0.5)' : '0 0 6px rgba(41,182,246,0.4)',
                    }}
                  >
                    {role.tag}
                  </span>
                </div>
                <h3
                  className="font-display"
                  style={{
                    color: '#e8d5c4',
                    fontSize: '1.15rem',
                    marginBottom: '0.75rem',
                    fontStyle: 'italic',
                  }}
                >
                  {role.name}
                </h3>
                <p style={{ color: '#7a6060', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  {role.description}
                </p>
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${role.team === 'evil' ? '#3d0a0a' : '#003a5a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <div
                    className={role.team === 'evil' ? 'bulb bulb-red' : 'bulb bulb-blue'}
                    style={{ width: '8px', height: '8px' }}
                  />
                  <span
                    style={{
                      fontFamily: "'Courier Prime', monospace",
                      color: role.team === 'evil' ? '#cc0000' : '#29b6f6',
                      fontSize: '0.65rem',
                      letterSpacing: '0.15em',
                      textShadow: role.team === 'evil' ? '0 0 6px rgba(204,0,0,0.4)' : '0 0 6px rgba(41,182,246,0.3)',
                    }}
                  >
                    {role.ability.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Red tape divider ── */}
      <div style={{ padding: '0 2rem' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #440000, transparent)',
          }}
        />
      </div>

      {/* ── Stats ── */}
      <section
        style={{
          padding: '5rem 2rem',
          position: 'relative',
          zIndex: 2,
          background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(80,0,0,0.06) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '3rem',
            textAlign: 'center',
          }}
        >
          {[
            { stat: '8–18', label: 'Players' },
            { stat: '30–60', label: 'Minutes' },
            { stat: '6+', label: 'Roles' },
            { stat: '0', label: 'Trust' },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="font-display glow-red animate-flicker-soft"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, fontStyle: 'italic' }}
              >
                {s.stat}
              </div>
              <div
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: '#5a3a3a',
                  fontSize: '0.65rem',
                  letterSpacing: '0.25em',
                  marginTop: '0.5rem',
                }}
              >
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to Play ── */}
      <section id="how-to-play" style={{ padding: '6rem 2rem', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <p
              style={{
                fontFamily: "'Courier Prime', monospace",
                color: '#cc0000',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                marginBottom: '1rem',
                textShadow: '0 0 8px rgba(204,0,0,0.4)',
              }}
            >
              // CLASSIFIED — DO NOT DISTRIBUTE //
            </p>
            <h2
              className="font-display glow-soft"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontStyle: 'italic', marginBottom: '1.5rem' }}
            >
              How to Play
            </h2>
            <div className="divider-red" />
          </div>

          <div style={{ position: 'relative' }}>
            {/* vertical line */}
            <div
              style={{
                position: 'absolute',
                left: '26px',
                top: '10px',
                bottom: '10px',
                width: '1px',
                background: 'linear-gradient(to bottom, #440000, #220000)',
              }}
            />

            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 1fr',
                  gap: '2rem',
                  marginBottom: i < steps.length - 1 ? '3rem' : '0',
                  position: 'relative',
                }}
              >
                {/* dot */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: step.bulb,
                      boxShadow: `0 0 8px ${step.bulb}, 0 0 16px ${step.bulb}60`,
                    }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.6rem' }}>
                    <span
                      style={{
                        fontFamily: "'Courier Prime', monospace",
                        color: '#440000',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Courier Prime', monospace",
                        color: '#cc0000',
                        fontSize: '0.6rem',
                        letterSpacing: '0.2em',
                        textShadow: '0 0 6px rgba(204,0,0,0.4)',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  <h3
                    className="font-display"
                    style={{ color: '#e8d5c4', fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '0.6rem' }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ color: '#7a6060', lineHeight: 1.75, fontSize: '0.95rem' }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        id="faq"
        style={{
          padding: '6rem 2rem',
          position: 'relative',
          zIndex: 2,
          background: 'linear-gradient(to bottom, transparent, rgba(20,4,10,0.8))',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p
              style={{
                fontFamily: "'Courier Prime', monospace",
                color: '#cc0000',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                marginBottom: '1rem',
                textShadow: '0 0 8px rgba(204,0,0,0.4)',
              }}
            >
              // FIELD NOTES //
            </p>
            <h2
              className="font-display glow-soft"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', marginBottom: '1.5rem' }}
            >
              Questions from the Field
            </h2>
            <div className="divider-red" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${openFaq === i ? '#440000' : '#1a0808'}`,
                  borderRadius: '1px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  className="faq-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ color: openFaq === i ? '#ff3333' : '#e8d5c4' }}
                >
                  <span>{faq.q}</span>
                  <span
                    style={{
                      color: '#cc0000',
                      fontSize: '1.1rem',
                      transform: openFaq === i ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.25s',
                      flexShrink: 0,
                      marginLeft: '1rem',
                      textShadow: '0 0 8px rgba(204,0,0,0.5)',
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    style={{
                      padding: '0 1.5rem 1.25rem',
                      background: '#0d0308',
                    }}
                  >
                    <p style={{ color: '#7a6060', lineHeight: 1.75, fontSize: '0.95rem' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: '8rem 2rem 10rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(140,0,0,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ marginBottom: '2.5rem' }}>
          <LightsString colors={LIGHT_COLORS.slice(0, 14)} />
        </div>

        <p
          style={{
            fontFamily: "'Courier Prime', monospace",
            color: '#cc0000',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            marginBottom: '1.5rem',
            textShadow: '0 0 8px rgba(204,0,0,0.4)',
          }}
        >
          — THE LIGHTS ARE FLICKERING —
        </p>
        <h2
          className="font-display glow-title"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontStyle: 'italic',
            lineHeight: 1,
            marginBottom: '2rem',
          }}
        >
          Gather Your Village
        </h2>
        <p
          style={{
            color: '#7a5a5a',
            maxWidth: '420px',
            margin: '0 auto 3rem',
            fontSize: '1rem',
            fontStyle: 'italic',
            lineHeight: 1.75,
          }}
        >
          The wolves are restless. Someone in your circle is not who they claim to be.
          The night is waiting.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#how-to-play" className="cta-btn">START PLAYING TONIGHT</a>
        </div>
        <p
          style={{
            marginTop: '2.5rem',
            fontFamily: "'Courier Prime', monospace",
            color: '#2a1010',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
          }}
        >
          NO PURCHASE REQUIRED · JUST DARKNESS AND WILLING PLAYERS
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid #1a0808',
          padding: '2rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span
          className="font-display animate-flicker-soft"
          style={{ color: '#3a1010', fontSize: '0.75rem', letterSpacing: '0.2em', fontStyle: 'italic' }}
        >
          WEREWOLVES
        </span>
        <span
          style={{
            fontFamily: "'Courier Prime', monospace",
            color: '#2a1010',
            fontSize: '0.75rem',
            fontStyle: 'italic',
            letterSpacing: '0.08em',
          }}
        >
          May the village survive the night.
        </span>
      </footer>
    </div>
  )
}

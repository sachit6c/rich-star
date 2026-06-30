import { useState, useEffect, useRef } from 'react'
import { fetchConstellation } from '../api'
import type { ConstellationData, MythologyEntry } from '../types'

interface Props {
  constellation: string | null
  onClose: () => void
}

const CULTURE_LABELS: Record<string, string> = {
  greek: 'Greek',
  arabic: 'Arabic',
  chinese: 'Chinese',
  indigenous_australian: 'Australian',
  hindu: 'Hindu',
  roman: 'Roman',
  babylonian: 'Babylonian',
  egyptian: 'Egyptian'
}

// Mock data so the panel is functional without the API
const MOCK_DATA: Record<string, ConstellationData> = {
  ORI: {
    constellation: { iau_abbr: 'ORI', name: 'Orion' },
    mythology: [
      {
        culture: 'greek',
        title: 'The Mighty Hunter',
        body: 'Orion was a giant huntsman placed among the stars by the gods. Son of Poseidon, he was said to be the greatest hunter who ever lived. His belt — three bright stars in a row — is the most recognizable asterism in the night sky. According to myth, he boasted he could kill every beast on Earth, which alarmed Gaia, who sent a great scorpion to slay him. Zeus placed them both in the sky on opposite sides so they would never meet again.',
        deity: 'Poseidon',
        fun_fact: 'Betelgeuse, Orion\'s right shoulder, is a red supergiant 700 times wider than our Sun. If placed at the center of our solar system, it would engulf Jupiter.'
      },
      {
        culture: 'arabic',
        title: 'Al-Jabbar, the Giant',
        body: 'In classical Arabic astronomy, Orion was known as Al-Jabbar — the powerful one. Arab astronomers gave individual names to nearly every star in this region: Betelgeuse (Yad al-Jawzah, "hand of the giant"), Rigel (Rijl al-Jawzah, "foot of the giant"), and Bellatrix (Al-Najid, "the conqueror"). The belt stars were called Al-Natah, Al-Anilam, and Al-Mintaka.',
        deity: null,
        fun_fact: 'Many of Orion\'s individual star names used worldwide today come directly from medieval Arabic astronomical texts, preserved and passed through Moorish Spain to Renaissance Europe.'
      },
      {
        culture: 'chinese',
        title: 'Shen, the Three Stars',
        body: 'Chinese astronomy identified the belt of Orion as "Shen" — a constellation representing a white tiger and one of the 28 lunar mansions. The three belt stars were known as the "Three Stars" and associated with fate and good fortune. The surrounding stars were grouped into separate lunar mansion asterisms: Jing (the well), and Gua (the bow and arrow).',
        deity: null,
        fun_fact: 'In Chinese mythology, Shen and Bi (the Pleiades/Taurus region) were two brothers cursed to never meet — they set and rise at opposite times, a celestial metaphor for family separation.'
      },
      {
        culture: 'indigenous_australian',
        title: 'Njiru, the Ancestor',
        body: 'For the Yolngu people of Arnhem Land, the stars of Orion represent Njiru, an ancestral being associated with ceremony and sacred knowledge. The constellation\'s visibility marks important seasons for fishing and ceremony. The belt stars are seen as a canoe, and the sword region as a group of fishermen pulling in nets from the dark waters of the Milky Way.',
        deity: 'Njiru',
        fun_fact: 'Aboriginal Australians have been observing and naming the stars for at least 65,000 years — the oldest continuous astronomical tradition on Earth.'
      },
      {
        culture: 'hindu',
        title: 'Mrigashira, the Deer\'s Head',
        body: 'In Hindu astronomy, three stars of Orion\'s head form the nakshatra Mrigashira — "the deer\'s head." This lunar mansion is ruled by Soma, the moon god, and is associated with gentleness, searching, and wandering. The presiding deity is Soma, and those born under Mrigashira are said to be gentle, generous, and eternally curious. Orion\'s belt corresponds to the nakshatra Mrigashira\'s neighboring asterism.',
        deity: 'Soma',
        fun_fact: 'The 27 nakshatras of Hindu astronomy formed one of the world\'s earliest coordinate systems — allowing ancient Indian astronomers to precisely track the moon\'s path through the sky.'
      }
    ]
  },
  LYR: {
    constellation: { iau_abbr: 'LYR', name: 'Lyra' },
    mythology: [
      {
        culture: 'greek',
        title: 'The Lyre of Orpheus',
        body: 'Lyra represents the golden lyre crafted by Hermes and given to Orpheus, the greatest musician in Greek mythology. Orpheus\'s music was so beautiful it could charm animals, trees, and even rocks. When his wife Eurydice died, he descended into the underworld and moved Hades himself to tears with his song. After Orpheus\'s death, Zeus placed his lyre in the heavens.',
        deity: 'Hermes',
        fun_fact: 'Vega, the brightest star in Lyra, was the North Star about 14,000 years ago and will be again in roughly 12,000 years due to Earth\'s axial precession.'
      },
      {
        culture: 'arabic',
        title: 'Al-Nasr al-Waki, the Swooping Eagle',
        body: 'Arab astronomers saw the bright star Vega as part of a large asterism called Al-Nasr al-Waki — the "swooping eagle" or "diving vulture." This contrasts with Altair in Aquila, which was the "soaring eagle." The two eagles face each other across the Milky Way in classical Arabic sky lore.',
        deity: null,
        fun_fact: 'Vega is a reference standard in astronomy — magnitude 0.0 was defined based on Vega, making it the original calibration star for measuring stellar brightness.'
      }
    ]
  },
  CMA: {
    constellation: { iau_abbr: 'CMA', name: 'Canis Major' },
    mythology: [
      {
        culture: 'greek',
        title: 'The Great Dog of Orion',
        body: 'Canis Major represents the larger of Orion\'s two hunting dogs, following their master across the sky. Some myths identify this dog as Laelaps, a magical hound destined to catch whatever it pursued. Zeus placed him in the sky when chasing an uncatchable Teumessian fox — both were immortalized as constellations to end the paradox of an unstoppable dog chasing an uncatchable prey.',
        deity: 'Zeus',
        fun_fact: 'Sirius, at magnitude -1.46, is the brightest star in the entire night sky. Its heliacal rising (first appearance before sunrise) was used by the ancient Egyptians to predict the Nile flood and mark the new year.'
      },
      {
        culture: 'egyptian',
        title: 'Sopdet, the Goddess of the Nile Flood',
        body: 'The Egyptians associated Sirius with Sopdet (Sothis), the goddess who brought the life-giving Nile flood. When Sirius reappeared in the dawn sky after 70 days of invisibility — its heliacal rising — the Nile would soon flood and renew the land. Sopdet was depicted as a woman with a star on her crown, and her appearance marked the Egyptian New Year and the beginning of the agricultural cycle.',
        deity: 'Sopdet',
        fun_fact: 'The ancient Egyptian calendar was based on the 365-day cycle of Sirius\'s heliacal rising. The famous Dendera zodiac temple ceiling depicts Sirius as a cow between two horns, sailing in a divine boat.'
      }
    ]
  },
  UMA: {
    constellation: { iau_abbr: 'UMA', name: 'Ursa Major' },
    mythology: [
      {
        culture: 'greek',
        title: 'Callisto and the Great Bear',
        body: 'Callisto was a nymph beloved by Zeus. When Hera discovered their affair, she transformed Callisto into a bear. Years later, Callisto\'s son Arcas nearly killed her while hunting. Zeus intervened and placed them both among the stars — Callisto as Ursa Major, Arcas as Boötes or Ursa Minor. The long tail seen in the sky constellation was created as Zeus swung them aloft.',
        deity: 'Zeus',
        fun_fact: 'The Big Dipper (the prominent asterism within Ursa Major) has been used for navigation for thousands of years. The two "pointer stars" at the end of the Dipper\'s bowl always point toward Polaris, the North Star.'
      },
      {
        culture: 'indigenous_australian',
        title: 'The Seven Sisters\' Guardian',
        body: 'Many Indigenous North American cultures, particularly the Iroquois and Algonquin peoples, see the Big Dipper as a great bear followed by three hunters. The handle stars are the hunters pursuing the bear across the sky. In autumn when the bear descends toward the horizon, its blood turns the leaves red. In spring, the bear rises again.',
        deity: null,
        fun_fact: 'In China, the Big Dipper was called the Northern Dipper (Beidou) and served as a cosmic clock — its handle points East in spring, South in summer, West in autumn, and North in winter.'
      }
    ]
  }
}

function getMockData(iau: string): ConstellationData {
  const key = iau.toUpperCase()
  if (MOCK_DATA[key]) return MOCK_DATA[key]
  return {
    constellation: { iau_abbr: iau, name: iau },
    mythology: [
      {
        culture: 'greek',
        title: 'Ancient Constellation',
        body: 'This constellation has been observed and named by ancient astronomers across many cultures. Its stars have guided sailors, farmers, and storytellers for thousands of years, each civilization weaving its own myths into the patterns they saw in the night sky.',
        deity: null,
        fun_fact: 'The 88 modern constellations were officially defined by the International Astronomical Union in 1930, but most have origins in ancient Babylonian, Greek, and Egyptian astronomy.'
      }
    ]
  }
}

export default function MythologyPanel({ constellation, onClose }: Props) {
  const [data, setData] = useState<ConstellationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('greek')
  const [error, setError] = useState<string | null>(null)

  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  const isOpen = constellation !== null

  // Load data when constellation changes
  useEffect(() => {
    if (!constellation) {
      setData(null)
      setError(null)
      setActiveTab('greek')
      return
    }
    setLoading(true)
    setError(null)
    setActiveTab('greek')

    fetchConstellation(constellation)
      .then((d) => {
        setData(d)
        setLoading(false)
        if (d.mythology.length > 0) {
          setActiveTab(d.mythology[0].culture)
        }
      })
      .catch(() => {
        // Fall back to mock data
        const mock = getMockData(constellation)
        setData(mock)
        setLoading(false)
        if (mock.mythology.length > 0) {
          setActiveTab(mock.mythology[0].culture)
        }
      })
  }, [constellation])

  // Swipe to close
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) {
      onClose()
    }
  }

  const activeEntry: MythologyEntry | undefined = data?.mythology.find(
    (m) => m.culture === activeTab
  ) ?? data?.mythology[0]

  const cultures = data?.mythology.map((m) => m.culture) ?? []

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 50,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          maxHeight: '80vh',
          background: '#0f1520',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.7)'
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            style={{
              width: 40,
              height: 4,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 2
            }}
          />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <div>
            {data ? (
              <>
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-0.5"
                  style={{ color: '#6366f1', fontFamily: 'var(--font-body)' }}
                >
                  Constellation
                </p>
                <h2
                  className="text-xl font-medium text-white"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
                >
                  {data.constellation.name}
                  <span
                    className="ml-2 text-sm font-normal"
                    style={{ color: '#4a5a7a', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
                  >
                    {data.constellation.iau_abbr}
                  </span>
                </h2>
              </>
            ) : (
              <div style={{ width: 120, height: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Culture tabs */}
        {cultures.length > 0 && (
          <div
            className="panel-scroll px-5 pb-2"
            style={{ display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}
          >
            {cultures.map((c) => (
              <button
                key={c}
                onClick={() => setActiveTab(c)}
                style={{
                  flexShrink: 0,
                  padding: '5px 14px',
                  borderRadius: 999,
                  border: activeTab === c ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.09)',
                  background: activeTab === c ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === c ? '#a5b4fc' : '#64748b',
                  fontSize: 12,
                  fontWeight: activeTab === c ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  transition: 'all 0.18s ease'
                }}
              >
                {CULTURE_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* Content area */}
        <div className="panel-scroll flex-1 px-5 py-4" style={{ overflowY: 'auto' }}>
          {loading && (
            <div className="flex items-center justify-center py-10 gap-3">
              <div
                className="spinner"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid rgba(99,102,241,0.2)',
                  borderTop: '2px solid #6366f1'
                }}
              />
              <span className="text-slate-500 text-sm tracking-wide">Loading mythology...</span>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && activeEntry && (
            <div className="flex flex-col gap-4 pb-6">
              {/* Entry title */}
              <h3
                className="text-lg font-medium leading-snug"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#e2e8f0',
                  letterSpacing: '0.04em'
                }}
              >
                {activeEntry.title}
              </h3>

              {/* Body text */}
              <p
                className="leading-relaxed"
                style={{
                  color: '#94a3b8',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.75
                }}
              >
                {activeEntry.body}
              </p>

              {/* Deity */}
              {activeEntry.deity && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs text-slate-500" style={{ fontFamily: 'var(--font-body)' }}>
                    Deity:
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#818cf8', fontFamily: 'var(--font-body)' }}
                  >
                    {activeEntry.deity}
                  </span>
                </div>
              )}

              {/* Fun fact */}
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p
                  className="text-xs tracking-widest uppercase mb-2"
                  style={{ color: '#475569', fontFamily: 'var(--font-body)' }}
                >
                  Stargazer's Note
                </p>
                <p
                  className="leading-relaxed"
                  style={{
                    color: '#64748b',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic'
                  }}
                >
                  {activeEntry.fun_fact}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

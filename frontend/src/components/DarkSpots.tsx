import { useState, useEffect } from 'react'
import type { Location } from '../types'
import { fetchDarkSpots } from '../api'

// ---- Fallback mock data ------------------------------------------------

const MOCK_SPOTS = [
  {
    name: 'Pinnacles National Park',
    distance: '92 mi',
    bortle: 2,
    direction: 'SE',
    description: 'Remote valley with almost no light pollution. Exceptional milky way views year-round.',
    elevation: '1,300 ft'
  },
  {
    name: 'Henry W. Coe State Park',
    distance: '48 mi',
    bortle: 3,
    direction: 'E',
    description: 'Large wilderness park east of San Jose with dark skies and limited road access.',
    elevation: '2,600 ft'
  },
  {
    name: 'Lake Berryessa',
    distance: '65 mi',
    bortle: 4,
    direction: 'NE',
    description: 'Reservoir surrounded by hills that block urban glow. Good transparency on dry nights.',
    elevation: '440 ft'
  },
  {
    name: 'Point Reyes National Seashore',
    distance: '38 mi',
    bortle: 4,
    direction: 'NW',
    description: 'Coastal location with marine layer trade-offs but dark skies when clear.',
    elevation: '120 ft'
  }
]

// ---- API types ---------------------------------------------------------

interface DarkSpot {
  lat: number
  lon: number
  distance_mi: number
  bortle: number
  sqm: number
  description: string
  maps_url: string
}

interface DarkSpotsResponse {
  user_bortle: number
  user_sqm: number
  spots: DarkSpot[]
}

// ---- Sub-components ----------------------------------------------------

function BortleIndicator({ value }: { value: number }) {
  const color =
    value <= 2 ? '#22c55e' :
    value <= 3 ? '#84cc16' :
    value <= 4 ? '#eab308' :
    value <= 5 ? '#f97316' : '#ef4444'

  const label =
    value <= 2 ? 'Excellent' :
    value <= 3 ? 'Very Good' :
    value <= 4 ? 'Good' :
    value <= 5 ? 'Moderate' : 'Poor'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: i < value ? color : 'rgba(255,255,255,0.07)'
          }}
        />
      ))}
      <span style={{ fontSize: 10, color, fontFamily: 'var(--font-body)', marginLeft: 2 }}>
        {label}
      </span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: '50%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
      <div style={{ width: '85%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

function ApiSpotCard({ spot }: { spot: DarkSpot }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              color: '#e2e8f0',
              margin: '0 0 2px',
              letterSpacing: '0.04em'
            }}
          >
            {spot.distance_mi.toFixed(1)} mi away
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-body)' }}>
              SQM {spot.sqm.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Bortle badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 10px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 52
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', lineHeight: 1, fontFamily: 'var(--font-body)' }}>
            {spot.bortle}
          </span>
          <span style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
            Bortle
          </span>
        </div>
      </div>

      {/* Bortle bar */}
      <div style={{ marginBottom: 10 }}>
        <BortleIndicator value={spot.bortle} />
      </div>

      <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
        {spot.description}
      </p>

      <a
        href={spot.maps_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 12,
          padding: '6px 14px',
          borderRadius: 999,
          border: '1px solid rgba(99,102,241,0.25)',
          background: 'rgba(99,102,241,0.08)',
          color: '#818cf8',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.04em',
          textDecoration: 'none'
        }}
      >
        Get Directions
      </a>
    </div>
  )
}

function MockSpotCard({ spot }: { spot: typeof MOCK_SPOTS[0] }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              color: '#e2e8f0',
              margin: '0 0 2px',
              letterSpacing: '0.04em'
            }}
          >
            {spot.name}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-body)' }}>
              {spot.direction} · {spot.distance}
            </span>
            <span style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--font-body)' }}>
              {spot.elevation}
            </span>
          </div>
        </div>

        {/* Bortle badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 10px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 52
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', lineHeight: 1, fontFamily: 'var(--font-body)' }}>
            {spot.bortle}
          </span>
          <span style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
            Bortle
          </span>
        </div>
      </div>

      {/* Bortle bar */}
      <div style={{ marginBottom: 10 }}>
        <BortleIndicator value={spot.bortle} />
      </div>

      <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
        {spot.description}
      </p>

      <button
        style={{
          marginTop: 12,
          padding: '6px 14px',
          borderRadius: 999,
          border: '1px solid rgba(99,102,241,0.25)',
          background: 'rgba(99,102,241,0.08)',
          color: '#818cf8',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.04em'
        }}
      >
        Get Directions
      </button>
    </div>
  )
}

// ---- Main component ----------------------------------------------------

interface Props {
  location: Location | null
}

export default function DarkSpots({ location }: Props) {
  const [apiData, setApiData] = useState<DarkSpotsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => {
    if (!location) {
      setUseMock(true)
      setApiData(null)
      return
    }
    setLoading(true)
    setUseMock(false)
    fetchDarkSpots(location.lat, location.lon)
      .then(data => {
        setApiData(data as DarkSpotsResponse)
        setLoading(false)
      })
      .catch(() => {
        setUseMock(true)
        setLoading(false)
      })
  }, [location])

  const sortedSpots = apiData
    ? [...apiData.spots].sort((a, b) => a.bortle - b.bortle)
    : null

  return (
    <div
      className="flex flex-col h-full panel-scroll"
      style={{ padding: '20px 16px', gap: 12 }}
    >
      {/* Header */}
      <div className="mb-2">
        <p
          className="text-xs tracking-[0.2em] uppercase mb-1"
          style={{ color: '#6366f1', fontFamily: 'var(--font-body)' }}
        >
          Nearby
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 500,
            color: '#e2e8f0',
            letterSpacing: '0.06em',
            margin: 0
          }}
        >
          Dark Sky Spots
        </h2>
      </div>

      {/* User's current sky quality (API only) */}
      {apiData && (
        <div
          className="rounded-xl px-4 py-3 mb-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ color: '#64748b', fontSize: 12, margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
            Your sky: <span style={{ color: '#94a3b8' }}>Bortle {apiData.user_bortle}</span>
            {' '}· SQM <span style={{ color: '#94a3b8' }}>{apiData.user_sqm.toFixed(1)}</span>
          </p>
        </div>
      )}

      {/* Explainer (mock) */}
      {useMock && (
        <div
          className="rounded-xl px-4 py-3 mb-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ color: '#64748b', fontSize: 12, margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
            Locations with low light pollution rated on the Bortle scale.
            Lower Bortle = darker skies. Class 1 is the darkest.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </>
      )}

      {/* Real API spot cards */}
      {!loading && sortedSpots && sortedSpots.map((spot, i) => (
        <ApiSpotCard key={i} spot={spot} />
      ))}

      {/* Mock fallback */}
      {!loading && useMock && MOCK_SPOTS.map((spot) => (
        <MockSpotCard key={spot.name} spot={spot} />
      ))}

      <div style={{ height: 16 }} />
    </div>
  )
}

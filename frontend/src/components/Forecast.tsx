import { useState, useEffect } from 'react'
import type { Location } from '../types'
import { fetchForecast } from '../api'

// ---- Fallback mock data ------------------------------------------------

const MOCK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MOCK_CONDITIONS = [
  { label: 'Clear', seeing: 9, transparency: 8, cloud: 0 },
  { label: 'Clear', seeing: 8, transparency: 9, cloud: 5 },
  { label: 'Partly Cloudy', seeing: 6, transparency: 6, cloud: 40 },
  { label: 'Cloudy', seeing: 4, transparency: 3, cloud: 80 },
  { label: 'Clear', seeing: 9, transparency: 9, cloud: 2 },
  { label: 'Clear', seeing: 7, transparency: 8, cloud: 10 },
  { label: 'Partly Cloudy', seeing: 5, transparency: 5, cloud: 55 }
]

// ---- API types ---------------------------------------------------------

interface VisiblePlanet {
  name: string
  max_alt: number
  rise: string
  set: string
}

interface IssPass {
  rise_time: string
  max_alt: number
  set_time: string
}

interface NightForecast {
  date: string
  twilight_start: string
  twilight_end: string
  dark_hours: number
  moon_phase: string
  moon_illumination: number
  moon_rise: string | null
  moon_set: string | null
  visible_planets: VisiblePlanet[]
  iss_passes: IssPass[]
  meteor_shower: string | null
}

interface ForecastResponse {
  nights: NightForecast[]
}

// ---- Sub-components ----------------------------------------------------

function SeeingBar({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 6,
            borderRadius: 2,
            background:
              i < value
                ? i < 4
                  ? '#ef4444'
                  : i < 7
                  ? '#f59e0b'
                  : '#22c55e'
                : 'rgba(255,255,255,0.07)'
          }}
        />
      ))}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ width: 80, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 120, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ width: 60, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ width: '80%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: '60%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(dateStr: string, index: number): { dayLabel: string; dateLabel: string } {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dayLabel = index === 0 ? 'Tonight' : d.toLocaleDateString('en-US', { weekday: 'short' })
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { dayLabel, dateLabel }
}

function NightCard({ night, index }: { night: NightForecast; index: number }) {
  const { dayLabel, dateLabel } = formatDate(night.date, index)
  const isToday = index === 0
  const moonPct = Math.round(night.moon_illumination * 100)

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: isToday ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
        border: isToday ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: isToday ? '#a5b4fc' : '#94a3b8',
              letterSpacing: '0.08em'
            }}
          >
            {dayLabel}
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: '#475569',
              fontFamily: 'var(--font-body)'
            }}
          >
            {dateLabel}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            padding: '2px 10px',
            borderRadius: 999,
            background: 'rgba(34,197,94,0.15)',
            color: '#4ade80',
            fontFamily: 'var(--font-body)'
          }}
        >
          {night.dark_hours.toFixed(1)} hrs dark
        </span>
      </div>

      {/* Moon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#475569', width: 80, fontFamily: 'var(--font-body)' }}>
            Moon
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-body)' }}>
            {night.moon_phase} · {moonPct}%
          </span>
        </div>

        {/* Planets */}
        {night.visible_planets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#475569', width: 80, flexShrink: 0, fontFamily: 'var(--font-body)' }}>
              Planets
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              {night.visible_planets.map(p => `${p.name} (${p.max_alt.toFixed(0)}°)`).join(', ')}
            </span>
          </div>
        )}

        {/* ISS passes */}
        {night.iss_passes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#475569', width: 80, flexShrink: 0, fontFamily: 'var(--font-body)' }}>
              ISS
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              {night.iss_passes.map(p =>
                `${formatTime(p.rise_time)} – ${formatTime(p.set_time)} (max ${p.max_alt.toFixed(0)}°)`
              ).join(', ')}
            </span>
          </div>
        )}

        {/* Meteor shower */}
        {night.meteor_shower && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#475569', width: 80, fontFamily: 'var(--font-body)' }}>
              Shower
            </span>
            <span style={{ fontSize: 10, color: '#fbbf24', fontFamily: 'var(--font-body)' }}>
              {night.meteor_shower}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function MockCard({ day, cond, index }: { day: string; cond: typeof MOCK_CONDITIONS[0]; index: number }) {
  const today = new Date()
  const date = new Date(today)
  date.setDate(today.getDate() + index)
  const isToday = index === 0

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: isToday ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
        border: isToday ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: isToday ? '#a5b4fc' : '#94a3b8',
              letterSpacing: '0.08em'
            }}
          >
            {isToday ? 'Tonight' : day}
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: '#475569',
              fontFamily: 'var(--font-body)'
            }}
          >
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            padding: '2px 10px',
            borderRadius: 999,
            background:
              cond.cloud < 20
                ? 'rgba(34,197,94,0.15)'
                : cond.cloud < 50
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)',
            color:
              cond.cloud < 20
                ? '#4ade80'
                : cond.cloud < 50
                ? '#fbbf24'
                : '#f87171',
            fontFamily: 'var(--font-body)'
          }}
        >
          {cond.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#475569', width: 80, fontFamily: 'var(--font-body)' }}>
            Seeing
          </span>
          <SeeingBar value={cond.seeing} />
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4, fontFamily: 'var(--font-body)' }}>
            {cond.seeing}/10
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#475569', width: 80, fontFamily: 'var(--font-body)' }}>
            Transparency
          </span>
          <SeeingBar value={cond.transparency} />
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4, fontFamily: 'var(--font-body)' }}>
            {cond.transparency}/10
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#475569', width: 80, fontFamily: 'var(--font-body)' }}>
            Cloud cover
          </span>
          <div
            style={{
              flex: 1,
              maxWidth: 120,
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.07)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${cond.cloud}%`,
                height: '100%',
                background:
                  cond.cloud < 20
                    ? '#22c55e'
                    : cond.cloud < 50
                    ? '#f59e0b'
                    : '#ef4444',
                borderRadius: 3
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-body)' }}>
            {cond.cloud}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ---- Main component ----------------------------------------------------

interface Props {
  location: Location | null
}

export default function Forecast({ location }: Props) {
  const [nights, setNights] = useState<NightForecast[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => {
    if (!location) {
      setUseMock(true)
      setNights(null)
      return
    }
    setLoading(true)
    setUseMock(false)
    fetchForecast(location.lat, location.lon)
      .then(data => {
        const resp = data as ForecastResponse
        setNights(resp.nights)
        setLoading(false)
      })
      .catch(() => {
        setUseMock(true)
        setLoading(false)
      })
  }, [location])

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
          Astronomical
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
          Weekly Forecast
        </h2>
      </div>

      {/* Notice banner */}
      {useMock && (
        <div
          className="rounded-xl px-4 py-3 mb-2"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <p style={{ color: '#818cf8', fontSize: 12, margin: 0, fontFamily: 'var(--font-body)' }}>
            Live forecast connects to your weather API. Showing sample data below.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </>
      )}

      {/* Real API data */}
      {!loading && nights && nights.map((night, i) => (
        <NightCard key={night.date} night={night} index={i} />
      ))}

      {/* Mock fallback */}
      {!loading && useMock && MOCK_DAYS.map((day, i) => (
        <MockCard key={day} day={day} cond={MOCK_CONDITIONS[i]} index={i} />
      ))}

      <div style={{ height: 16 }} />
    </div>
  )
}

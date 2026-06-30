const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CONDITIONS = [
  { label: 'Clear', seeing: 9, transparency: 8, cloud: 0 },
  { label: 'Clear', seeing: 8, transparency: 9, cloud: 5 },
  { label: 'Partly Cloudy', seeing: 6, transparency: 6, cloud: 40 },
  { label: 'Cloudy', seeing: 4, transparency: 3, cloud: 80 },
  { label: 'Clear', seeing: 9, transparency: 9, cloud: 2 },
  { label: 'Clear', seeing: 7, transparency: 8, cloud: 10 },
  { label: 'Partly Cloudy', seeing: 5, transparency: 5, cloud: 55 }
]

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

export default function Forecast() {
  const today = new Date()

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

      {/* Placeholder notice */}
      <div
        className="rounded-xl px-4 py-3 mb-2"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <p style={{ color: '#818cf8', fontSize: 12, margin: 0, fontFamily: 'var(--font-body)' }}>
          Live forecast connects to your weather API. Showing sample data below.
        </p>
      </div>

      {/* Day cards */}
      {DAYS.map((day, i) => {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const cond = CONDITIONS[i]
        const isToday = i === 0

        return (
          <div
            key={day}
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
      })}

      <div style={{ height: 16 }} />
    </div>
  )
}

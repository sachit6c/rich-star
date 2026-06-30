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

export default function DarkSpots() {
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

      {/* Explainer */}
      <div
        className="rounded-xl px-4 py-3 mb-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p style={{ color: '#64748b', fontSize: 12, margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
          Locations with low light pollution rated on the Bortle scale.
          Lower Bortle = darker skies. Class 1 is the darkest.
        </p>
      </div>

      {/* Spot cards */}
      {MOCK_SPOTS.map((spot) => (
        <div
          key={spot.name}
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
      ))}

      <div style={{ height: 16 }} />
    </div>
  )
}

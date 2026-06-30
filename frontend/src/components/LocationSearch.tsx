import { useState } from 'react'
import type { Location } from '../types'

interface Props {
  onLocationSet: (loc: Location) => void
}

export default function LocationSearch({ onLocationSet }: Props) {
  const [cityInput, setCityInput] = useState('')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        onLocationSet({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'My Location'
        })
      },
      (err) => {
        setGeoLoading(false)
        setGeoError(err.message || 'Unable to retrieve location.')
      },
      { timeout: 10000 }
    )
  }

  function handleCitySearch() {
    const name = cityInput.trim() || 'San Francisco'
    // Placeholder coordinates — geocoding to be wired in later
    const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
      'san francisco': { lat: 37.77, lon: -122.41 },
      'new york': { lat: 40.71, lon: -74.0 },
      'london': { lat: 51.51, lon: -0.13 },
      'tokyo': { lat: 35.68, lon: 139.69 },
      'sydney': { lat: -33.87, lon: 151.21 },
      'paris': { lat: 48.85, lon: 2.35 },
      'dubai': { lat: 25.2, lon: 55.27 },
      'chicago': { lat: 41.88, lon: -87.63 }
    }
    const key = name.toLowerCase()
    const coords = CITY_COORDS[key] || { lat: 37.77, lon: -122.41 }
    onLocationSet({ lat: coords.lat, lon: coords.lon, name })
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: '#050810' }}
    >
      {/* Background subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(99,102,241,0.08) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            {/* Star cluster icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="2" fill="#f0c040" />
              <circle cx="8" cy="12" r="1.2" fill="white" opacity="0.9" />
              <circle cx="32" cy="10" r="1.5" fill="white" opacity="0.8" />
              <circle cx="10" cy="30" r="1" fill="white" opacity="0.7" />
              <circle cx="30" cy="32" r="1.3" fill="white" opacity="0.85" />
              <circle cx="20" cy="6" r="1.1" fill="white" opacity="0.75" />
              <circle cx="34" cy="22" r="0.9" fill="#93c5fd" opacity="0.8" />
              <circle cx="5" cy="20" r="1" fill="#93c5fd" opacity="0.7" />
            </svg>
          </div>
          <h1
            className="font-display text-2xl font-medium tracking-[0.1em] text-white mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Find Your Sky
          </h1>
          <p className="text-slate-500 text-sm tracking-wide">
            Allow location access or search by city
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'rgba(13,17,23,0.9)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Geolocation button */}
          <button
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium tracking-wide transition-all"
            style={{
              background: geoLoading
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              cursor: geoLoading ? 'wait' : 'pointer'
            }}
          >
            {geoLoading ? (
              <>
                <svg
                  className="spinner"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Locating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <circle cx="12" cy="12" r="8" strokeOpacity="0.4" />
                </svg>
                Use My Location
              </>
            )}
          </button>

          {geoError && (
            <p className="text-xs text-red-400 text-center -mt-2">{geoError}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-slate-600 text-xs tracking-widest uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* City search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
              placeholder="Enter city name..."
              className="flex-1 py-2.5 px-3 rounded-xl text-sm text-slate-300 placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-body)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            />
            <button
              onClick={handleCitySearch}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
              }}
            >
              Search
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-slate-700 text-xs tracking-widest uppercase">
          Rich Star · Real-time sky atlas
        </p>
      </div>
    </div>
  )
}

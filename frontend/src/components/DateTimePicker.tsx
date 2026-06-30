import { useState, useRef, useEffect } from 'react'

interface Props {
  dateTime: Date
  onChange: (dt: Date) => void
}

function formatDisplay(dt: Date): string {
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function toLocalInputValue(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = dt.getFullYear()
  const mo = pad(dt.getMonth() + 1)
  const d = pad(dt.getDate())
  const h = pad(dt.getHours())
  const mi = pad(dt.getMinutes())
  return `${y}-${mo}-${d}T${h}:${mi}`
}

export default function DateTimePicker({ dateTime, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!expanded) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val) return
    const dt = new Date(val)
    if (!isNaN(dt.getTime())) {
      onChange(dt)
    }
  }

  function handleLive() {
    onChange(new Date())
    setExpanded(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Collapsed pill */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="glass-card flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
        style={{
          border: expanded ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer',
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="text-slate-300 text-xs tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
          {formatDisplay(dateTime)}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="absolute top-full right-0 mt-2 rounded-xl p-3 flex flex-col gap-2.5"
          style={{
            background: 'rgba(13,17,23,0.95)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
            minWidth: '220px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}
        >
          <p className="text-slate-500 text-xs tracking-widest uppercase mb-1">Set Date &amp; Time</p>
          <input
            type="datetime-local"
            value={toLocalInputValue(dateTime)}
            onChange={handleInputChange}
            className="w-full rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              colorScheme: 'dark',
              fontFamily: 'var(--font-body)'
            }}
          />
          <button
            onClick={handleLive}
            className="w-full py-2 rounded-lg text-xs font-medium tracking-wide text-indigo-400 transition-all"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.22)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
            }}
          >
            Live — Return to Now
          </button>
        </div>
      )}
    </div>
  )
}

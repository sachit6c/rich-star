interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

function TelescopeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 4.25 5.5 11 7 13 1.5-2 7-8.75 7-13 0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const TABS: Tab[] = [
  { id: 'sky',       label: 'Sky',      icon: <TelescopeIcon /> },
  { id: 'forecast',  label: 'Forecast', icon: <CalendarIcon /> },
  { id: 'darkspots', label: 'Dark Spots', icon: <PinIcon /> },
  { id: 'settings',  label: 'Settings', icon: <GearIcon /> }
]

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'rgba(5, 8, 16, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 56,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#818cf8' : '#4b5563',
              transition: 'color 0.18s ease',
              position: 'relative'
            }}
          >
            {/* Active indicator line at top */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                  borderRadius: '0 0 2px 2px'
                }}
              />
            )}

            {/* Icon */}
            <span style={{ color: isActive ? '#818cf8' : '#4b5563', transition: 'color 0.18s ease' }}>
              {tab.icon}
            </span>

            {/* Label */}
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-body)',
                color: isActive ? '#818cf8' : '#4b5563',
                transition: 'color 0.18s ease',
                lineHeight: 1
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

import { useState, useEffect } from 'react'
import type { Location } from './types'
import LocationSearch from './components/LocationSearch'
import SkyDome from './components/SkyDome'
import DateTimePicker from './components/DateTimePicker'
import MythologyPanel from './components/MythologyPanel'
import BottomNav from './components/BottomNav'
import Forecast from './components/Forecast'
import DarkSpots from './components/DarkSpots'

type Tab = 'sky' | 'forecast' | 'darkspots' | 'settings'

export default function App() {
  const [location, setLocation] = useState<Location | null>(null)
  const [dateTime, setDateTime] = useState<Date>(new Date())
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('sky')
  const [locating, setLocating] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'My Location'
        })
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Tick live time every minute when in "live" mode
  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (locating) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#050810' }}>
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent spinner"
            style={{ borderTopColor: '#6366f1', borderRightColor: 'rgba(99,102,241,0.3)' }}
          />
        </div>
        <p className="font-display text-xs tracking-[0.25em] text-slate-400 uppercase">
          Locating sky
        </p>
      </div>
    )
  }

  if (!location) {
    return <LocationSearch onLocationSet={setLocation} />
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#050810' }}>
      {/* Sky dome fills all space above nav */}
      <div className="relative flex-1 overflow-hidden">
        {activeTab === 'sky' && (
          <SkyDome
            location={location}
            dateTime={dateTime}
            onConstellationSelect={(iau) => setSelectedConstellation(iau)}
          />
        )}
        {activeTab === 'forecast' && <Forecast />}
        {activeTab === 'darkspots' && <DarkSpots />}
        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <p className="font-display text-lg text-slate-300 tracking-widest">Settings</p>
            <p className="text-slate-500 text-sm text-center">
              Location: {location.name}<br />
              {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </p>
            <button
              onClick={() => setLocation(null)}
              className="mt-4 px-6 py-2 rounded-full text-sm text-slate-400 border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Change Location
            </button>
          </div>
        )}

        {/* DateTimePicker floating top-right, only on sky tab */}
        {activeTab === 'sky' && (
          <div className="absolute top-4 right-4 z-40">
            <DateTimePicker dateTime={dateTime} onChange={setDateTime} />
          </div>
        )}

        {/* Location chip top-left */}
        {activeTab === 'sky' && (
          <div className="absolute top-4 left-4 z-40">
            <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              <span className="text-slate-400 text-xs tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
                {location.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />

      {/* Mythology Panel overlaid */}
      <MythologyPanel
        constellation={selectedConstellation}
        onClose={() => setSelectedConstellation(null)}
      />
    </div>
  )
}

import type { SkyData, ConstellationData } from './types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function formatDT(dt: Date): string {
  return dt.toISOString()
}

export async function fetchSky(lat: number, lon: number, dt: Date): Promise<SkyData> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    dt: formatDT(dt)
  })
  const res = await fetch(`${BASE}/sky?${params}`)
  if (!res.ok) throw new Error(`fetchSky failed: ${res.status}`)
  return res.json() as Promise<SkyData>
}

export async function fetchConstellation(iauAbbr: string): Promise<ConstellationData> {
  const res = await fetch(`${BASE}/constellation/${encodeURIComponent(iauAbbr)}`)
  if (!res.ok) throw new Error(`fetchConstellation failed: ${res.status}`)
  return res.json() as Promise<ConstellationData>
}

export async function fetchSatellites(lat: number, lon: number): Promise<unknown> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  const res = await fetch(`${BASE}/satellites?${params}`)
  if (!res.ok) throw new Error(`fetchSatellites failed: ${res.status}`)
  return res.json()
}

export async function fetchForecast(lat: number, lon: number): Promise<unknown> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  const res = await fetch(`${BASE}/forecast?${params}`)
  if (!res.ok) throw new Error(`fetchForecast failed: ${res.status}`)
  return res.json()
}

export async function fetchDarkSpots(lat: number, lon: number): Promise<unknown> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  const res = await fetch(`${BASE}/dark-spots?${params}`)
  if (!res.ok) throw new Error(`fetchDarkSpots failed: ${res.status}`)
  return res.json()
}

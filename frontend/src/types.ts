export interface Location {
  lat: number
  lon: number
  name: string
}

export interface StarData {
  hip: number
  name: string
  magnitude: number
  az: number
  alt: number
  constellation: string
}

export interface PlanetData {
  name: string
  az: number
  alt: number
  magnitude: number
}

export interface MoonData {
  az: number
  alt: number
  phase: number
  illumination: number
}

export interface SunData {
  az: number
  alt: number
  is_up: boolean
}

export interface SkyData {
  stars: StarData[]
  planets: PlanetData[]
  moon: MoonData
  sun: SunData
  constellation_lines: Record<string, [number, number][]>
}

export interface MythologyEntry {
  culture: string
  title: string
  body: string
  deity: string | null
  fun_fact: string
}

export interface ConstellationData {
  constellation: {
    iau_abbr: string
    name: string
  }
  mythology: MythologyEntry[]
}

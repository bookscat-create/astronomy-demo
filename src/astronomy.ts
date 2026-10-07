export interface Star {
  id: string
  name: string
  ra: number
  dec: number
  magnitude: number
  color: string
}

export interface HorizontalPosition {
  altitude: number
  azimuth: number
  east: number
  up: number
  north: number
}

export type DailyBehavior = 'circumpolar' | 'rises-and-sets' | 'below-horizon'

export const STARS: Star[] = [
  { id: 'polaris', name: 'Polaris', ra: 37.95, dec: 89.26, magnitude: 2.0, color: '#ffe2a3' },
  { id: 'vega', name: 'Vega', ra: 279.23, dec: 38.78, magnitude: 0.03, color: '#a6d7ff' },
  { id: 'deneb', name: 'Deneb', ra: 310.36, dec: 45.28, magnitude: 1.25, color: '#d8eaff' },
  { id: 'altair', name: 'Altair', ra: 297.70, dec: 8.87, magnitude: 0.77, color: '#fff0ca' },
  { id: 'arcturus', name: 'Arcturus', ra: 213.92, dec: 19.18, magnitude: -0.05, color: '#ffbb72' },
  { id: 'spica', name: 'Spica', ra: 201.30, dec: -11.16, magnitude: 0.98, color: '#a9cfff' },
  { id: 'antares', name: 'Antares', ra: 247.35, dec: -26.43, magnitude: 1.06, color: '#ff9a7d' },
  { id: 'sirius', name: 'Sirius', ra: 101.29, dec: -16.72, magnitude: -1.46, color: '#c8e6ff' },
  { id: 'betelgeuse', name: 'Betelgeuse', ra: 88.79, dec: 7.41, magnitude: 0.42, color: '#ffad7a' },
  { id: 'rigel', name: 'Rigel', ra: 78.63, dec: -8.20, magnitude: 0.13, color: '#b6dcff' },
  { id: 'capella', name: 'Capella', ra: 79.17, dec: 46.00, magnitude: 0.08, color: '#ffe2a3' },
  { id: 'procyon', name: 'Procyon', ra: 114.83, dec: 5.23, magnitude: 0.34, color: '#fff0ca' },
  { id: 'fomalhaut', name: 'Fomalhaut', ra: 344.41, dec: -29.62, magnitude: 1.16, color: '#c8e6ff' },
  { id: 'regulus', name: 'Regulus', ra: 152.09, dec: 11.97, magnitude: 1.35, color: '#c8e6ff' },
]

const toRadians = (degrees: number) => degrees * Math.PI / 180
const toDegrees = (radians: number) => radians * 180 / Math.PI
const wrapDegrees = (degrees: number) => ((degrees % 360) + 360) % 360

export function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5
}

export function localSiderealDegrees(date: Date, longitude = 0): number {
  const jd = julianDay(date)
  const centuries = (jd - 2_451_545) / 36_525
  const greenwich = 280.46061837
    + 360.98564736629 * (jd - 2_451_545)
    + 0.000387933 * centuries ** 2
    - centuries ** 3 / 38_710_000

  return wrapDegrees(greenwich + longitude)
}

export function equatorialToHorizontal(
  ra: number,
  dec: number,
  date: Date,
  latitude: number,
  longitude = 0,
): HorizontalPosition {
  const hourAngle = toRadians(wrapDegrees(localSiderealDegrees(date, longitude) - ra))
  const declination = toRadians(dec)
  const observerLatitude = toRadians(latitude)
  const east = -Math.cos(declination) * Math.sin(hourAngle)
  const north = Math.sin(declination) * Math.cos(observerLatitude)
    - Math.cos(declination) * Math.cos(hourAngle) * Math.sin(observerLatitude)
  const up = Math.sin(declination) * Math.sin(observerLatitude)
    + Math.cos(declination) * Math.cos(hourAngle) * Math.cos(observerLatitude)

  return {
    altitude: toDegrees(Math.asin(Math.max(-1, Math.min(1, up)))),
    azimuth: wrapDegrees(toDegrees(Math.atan2(east, north))),
    east,
    up,
    north,
  }
}

export function getDailyBehavior(dec: number, latitude: number): DailyBehavior {
  const combinedAngle = Math.abs(dec) + Math.abs(latitude)
  if (dec * latitude > 0 && combinedAngle >= 90) return 'circumpolar'
  if (dec * latitude < 0 && combinedAngle >= 90) return 'below-horizon'
  return 'rises-and-sets'
}
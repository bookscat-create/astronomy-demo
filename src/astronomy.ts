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

export interface SphereDirection {
  east: number
  up: number
  north: number
}

export interface CoordinatePaths {
  altitude: SphereDirection[]
  rightAscension: SphereDirection[]
  declination: SphereDirection[]
  vernalEquinox: SphereDirection
  equatorCrossing: SphereDirection
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
  { id: 'achernar', name: 'Achernar', ra: 24.43, dec: -57.24, magnitude: 0.46, color: '#a9cfff' },
  { id: 'acrux', name: 'Acrux', ra: 186.65, dec: -63.10, magnitude: 0.76, color: '#a9cfff' },
  { id: 'aldebaran', name: 'Aldebaran', ra: 68.98, dec: 16.51, magnitude: 0.85, color: '#ffad7a' },
  { id: 'alkaid', name: 'Alkaid', ra: 206.89, dec: 49.31, magnitude: 1.86, color: '#b6dcff' },
  { id: 'alnair', name: 'Alnair', ra: 332.06, dec: -46.96, magnitude: 1.74, color: '#b6dcff' },
  { id: 'alphard', name: 'Alphard', ra: 141.90, dec: -8.66, magnitude: 1.98, color: '#ffbb72' },
  { id: 'alphecca', name: 'Alphecca', ra: 233.67, dec: 26.71, magnitude: 2.23, color: '#d8eaff' },
  { id: 'alpheratz', name: 'Alpheratz', ra: 2.10, dec: 29.09, magnitude: 2.06, color: '#d8eaff' },
  { id: 'ankaa', name: 'Ankaa', ra: 6.57, dec: -42.31, magnitude: 2.40, color: '#ffbb72' },
  { id: 'bellatrix', name: 'Bellatrix', ra: 81.28, dec: 6.35, magnitude: 1.64, color: '#a9cfff' },
  { id: 'canopus', name: 'Canopus', ra: 95.99, dec: -52.70, magnitude: -0.74, color: '#d8eaff' },
  { id: 'castor', name: 'Castor', ra: 113.65, dec: 31.89, magnitude: 1.58, color: '#d8eaff' },
  { id: 'caph', name: 'Caph', ra: 2.29, dec: 59.15, magnitude: 2.27, color: '#fff0ca' },
  { id: 'denebola', name: 'Denebola', ra: 177.26, dec: 14.57, magnitude: 2.14, color: '#d8eaff' },
  { id: 'dubhe', name: 'Dubhe', ra: 165.93, dec: 61.75, magnitude: 1.79, color: '#ffe2a3' },
  { id: 'elnath', name: 'Elnath', ra: 81.57, dec: 28.61, magnitude: 1.65, color: '#b6dcff' },
  { id: 'hadar', name: 'Hadar', ra: 210.96, dec: -60.37, magnitude: 0.61, color: '#a9cfff' },
  { id: 'hamal', name: 'Hamal', ra: 31.79, dec: 23.46, magnitude: 2.00, color: '#ffbb72' },
  { id: 'kochab', name: 'Kochab', ra: 222.68, dec: 74.16, magnitude: 2.08, color: '#ffbb72' },
  { id: 'markab', name: 'Markab', ra: 346.19, dec: 15.21, magnitude: 2.49, color: '#b6dcff' },
  { id: 'menkalinan', name: 'Menkalinan', ra: 89.88, dec: 44.95, magnitude: 1.90, color: '#fff0ca' },
  { id: 'mintaka', name: 'Mintaka', ra: 83.00, dec: -0.30, magnitude: 2.23, color: '#b6dcff' },
  { id: 'mirfak', name: 'Mirfak', ra: 51.08, dec: 49.86, magnitude: 1.79, color: '#fff0ca' },
  { id: 'mirach', name: 'Mirach', ra: 17.43, dec: 35.62, magnitude: 2.05, color: '#ffad7a' },
  { id: 'merak', name: 'Merak', ra: 165.46, dec: 56.38, magnitude: 2.37, color: '#d8eaff' },
  { id: 'mizar', name: 'Mizar', ra: 200.98, dec: 54.93, magnitude: 2.23, color: '#d8eaff' },
  { id: 'nunki', name: 'Nunki', ra: 283.82, dec: -26.30, magnitude: 2.02, color: '#b6dcff' },
  { id: 'peacock', name: 'Peacock', ra: 306.41, dec: -56.74, magnitude: 1.94, color: '#b6dcff' },
  { id: 'schedar', name: 'Schedar', ra: 10.13, dec: 56.54, magnitude: 2.23, color: '#ffad7a' },
  { id: 'shaula', name: 'Shaula', ra: 263.40, dec: -37.10, magnitude: 1.63, color: '#a9cfff' },
  { id: 'suhail', name: 'Suhail', ra: 137.82, dec: -43.43, magnitude: 2.21, color: '#ffad7a' },
  { id: 'wezen', name: 'Wezen', ra: 104.66, dec: -26.39, magnitude: 1.83, color: '#ffe2a3' },
  { id: 'algol', name: 'Algol', ra: 47.04, dec: 40.96, magnitude: 2.12, color: '#d8eaff' },
  { id: 'almach', name: 'Almach', ra: 30.97, dec: 42.33, magnitude: 2.10, color: '#ffbb72' },
  { id: 'alnitak', name: 'Alnitak', ra: 85.19, dec: -1.94, magnitude: 1.74, color: '#a9cfff' },
  { id: 'rasalhague', name: 'Rasalhague', ra: 263.73, dec: 12.56, magnitude: 2.08, color: '#d8eaff' },
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

export function getCoordinatePaths(
  ra: number,
  dec: number,
  date: Date,
  latitude: number,
  samples = 48,
): CoordinatePaths {
  const selected = equatorialToHorizontal(ra, dec, date, latitude)
  const equatorCrossing = equatorialToHorizontal(ra, 0, date, latitude)
  const vernalEquinox = equatorialToHorizontal(0, 0, date, latitude)
  const altitudeAzimuth = toRadians(selected.azimuth)
  const altitude = Array.from({ length: samples + 1 }, (_, index) => {
    const elevation = toRadians(selected.altitude * index / samples)
    return {
      east: Math.cos(elevation) * Math.sin(altitudeAzimuth),
      up: Math.sin(elevation),
      north: Math.cos(elevation) * Math.cos(altitudeAzimuth),
    }
  })
  const rightAscension = Array.from({ length: samples + 1 }, (_, index) => {
    const position = equatorialToHorizontal(ra * index / samples, 0, date, latitude)
    return { east: position.east, up: position.up, north: position.north }
  })
  const declination = Array.from({ length: samples + 1 }, (_, index) => {
    const position = equatorialToHorizontal(ra, dec * index / samples, date, latitude)
    return { east: position.east, up: position.up, north: position.north }
  })

  return {
    altitude,
    rightAscension,
    declination,
    vernalEquinox: { east: vernalEquinox.east, up: vernalEquinox.up, north: vernalEquinox.north },
    equatorCrossing: { east: equatorCrossing.east, up: equatorCrossing.up, north: equatorCrossing.north },
  }
}

export function getDailyBehavior(dec: number, latitude: number): DailyBehavior {
  const combinedAngle = Math.abs(dec) + Math.abs(latitude)
  if (dec * latitude > 0 && combinedAngle >= 90) return 'circumpolar'
  if (dec * latitude < 0 && combinedAngle >= 90) return 'below-horizon'
  return 'rises-and-sets'
}
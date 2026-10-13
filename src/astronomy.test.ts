import { describe, expect, it } from 'vitest'
import { equatorialToHorizontal, getCoordinatePaths, getDailyBehavior, localSiderealDegrees, STARS } from './astronomy'

describe('celestial coordinate model', () => {
  it('provides an expanded catalog with unique IDs and valid coordinates', () => {
    expect(STARS.length).toBeGreaterThanOrEqual(50)
    expect(new Set(STARS.map((star) => star.id)).size).toBe(STARS.length)

    for (const star of STARS) {
      expect(star.ra).toBeGreaterThanOrEqual(0)
      expect(star.ra).toBeLessThan(360)
      expect(star.dec).toBeGreaterThanOrEqual(-90)
      expect(star.dec).toBeLessThanOrEqual(90)
    }
  })

  it('places a star on the meridian at its local sidereal transit', () => {
    const date = new Date('2026-10-07T21:00:00.000Z')
    const rightAscension = localSiderealDegrees(date)
    const position = equatorialToHorizontal(rightAscension, 0, date, 0)

    expect(position.altitude).toBeCloseTo(90, 6)
    expect(Math.abs(position.east)).toBeLessThan(1e-8)
  })

  it('moves a transiting equatorial star west as sidereal time advances', () => {
    const transit = new Date('2026-10-07T21:00:00.000Z')
    const rightAscension = localSiderealDegrees(transit)
    const afterThreeHours = new Date(transit.getTime() + 3 * 60 * 60 * 1000)
    const position = equatorialToHorizontal(rightAscension, 0, afterThreeHours, 0)

    expect(position.east).toBeLessThan(0)
    expect(position.azimuth).toBeGreaterThan(180)
    expect(position.altitude).toBeCloseTo(44.88, 1)
  })

  it('anchors selected-star coordinate paths to their correct references', () => {
    const date = new Date('2026-10-07T21:00:00.000Z')
    const star = STARS.find((candidate) => candidate.id === 'vega')!
    const selected = equatorialToHorizontal(star.ra, star.dec, date, 40)
    const equator = equatorialToHorizontal(star.ra, 0, date, 40)
    const vernalEquinox = equatorialToHorizontal(0, 0, date, 40)
    const paths = getCoordinatePaths(star.ra, star.dec, date, 40)
    const end = (points: typeof paths.altitude) => points[points.length - 1]

    expect(paths.altitude[0].up).toBeCloseTo(0, 8)
    expect(end(paths.altitude).up).toBeCloseTo(selected.up, 8)
    expect(paths.rightAscension[0].east).toBeCloseTo(vernalEquinox.east, 8)
    expect(end(paths.rightAscension).east).toBeCloseTo(equator.east, 8)
    expect(end(paths.declination).up).toBeCloseTo(selected.up, 8)
    expect(paths.equatorCrossing.north).toBeCloseTo(equator.north, 8)
  })

  it('identifies stars that circle the pole or never rise', () => {
    expect(getDailyBehavior(60, 40)).toBe('circumpolar')
    expect(getDailyBehavior(-60, 40)).toBe('below-horizon')
    expect(getDailyBehavior(0, 40)).toBe('rises-and-sets')
  })
})
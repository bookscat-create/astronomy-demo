import { describe, expect, it } from 'vitest'
import { equatorialToHorizontal, getDailyBehavior, localSiderealDegrees } from './astronomy'

describe('celestial coordinate model', () => {
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

  it('identifies stars that circle the pole or never rise', () => {
    expect(getDailyBehavior(60, 40)).toBe('circumpolar')
    expect(getDailyBehavior(-60, 40)).toBe('below-horizon')
    expect(getDailyBehavior(0, 40)).toBe('rises-and-sets')
  })
})
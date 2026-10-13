import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { equatorialToHorizontal, getCoordinatePaths, STARS } from './astronomy'

const RADIUS = 3.2
const EQUATOR_POINTS = 160
const COORDINATE_NAMES = ['altitude', 'rightAscension', 'declination'] as const
const SPHERE_REFERENCE_NAMES = ['zenith', 'nadir', 'meridian'] as const
type CoordinateName = typeof COORDINATE_NAMES[number]

interface SphereViewProps {
  date: Date
  latitude: number
  selectedStarId: string
  showGrid: boolean
  showConstellations: boolean
  showCoordinates: boolean
  showSphereReferences: boolean
  constellationPairs: string[][]
  resetToken: number
  onSelectStar: (id: string) => void
}

interface SphereScene {
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  starMeshes: Map<string, THREE.Mesh>
  halo: THREE.Mesh
  equator: THREE.Line
  pole: THREE.Line
  grid: THREE.LineSegments
  constellations: THREE.LineSegments
  coordinateArcs: Record<CoordinateName, THREE.Line>
  coordinateAnchors: Record<CoordinateName, THREE.Vector3>
  meridian: THREE.Line
  zenithMarker: THREE.Mesh
  nadirMarker: THREE.Mesh
  circumpolarRegion: THREE.Mesh
  circumpolarBoundary: THREE.LineLoop
  animationFrame: number
}

function toHorizonVector(ra: number, dec: number, date: Date, latitude: number, radius: number) {
  const position = equatorialToHorizontal(ra, dec, date, latitude)
  return new THREE.Vector3(position.east, position.up, position.north).multiplyScalar(radius)
}

function lineSegments(points: number[], color: number, opacity: number) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  return new THREE.LineSegments(geometry, material)
}

function makeGrid() {
  const points: number[] = []
  const addSegment = (a: THREE.Vector3, b: THREE.Vector3) => points.push(...a.toArray(), ...b.toArray())

  for (let altitude = -60; altitude <= 75; altitude += 15) {
    if (altitude === 0) continue
    const elevation = THREE.MathUtils.degToRad(altitude)
    let previous: THREE.Vector3 | undefined
    for (let step = 0; step <= 120; step += 1) {
      const azimuth = step / 120 * Math.PI * 2
      const current = new THREE.Vector3(
        RADIUS * Math.cos(elevation) * Math.sin(azimuth),
        RADIUS * Math.sin(elevation),
        RADIUS * Math.cos(elevation) * Math.cos(azimuth),
      )
      if (previous) addSegment(previous, current)
      previous = current
    }
  }

  for (let azimuthDegrees = 0; azimuthDegrees < 180; azimuthDegrees += 30) {
    const azimuth = THREE.MathUtils.degToRad(azimuthDegrees)
    let previous: THREE.Vector3 | undefined
    for (let step = 0; step <= 72; step += 1) {
      const elevation = THREE.MathUtils.degToRad(-90 + step * 2.5)
      const current = new THREE.Vector3(
        RADIUS * Math.cos(elevation) * Math.sin(azimuth),
        RADIUS * Math.sin(elevation),
        RADIUS * Math.cos(elevation) * Math.cos(azimuth),
      )
      if (previous) addSegment(previous, current)
      previous = current
    }
  }

  return lineSegments(points, 0x7ba69e, 0.2)
}

function makeEquator() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((EQUATOR_POINTS + 1) * 3), 3))
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color: 0xe6b56d,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  }))
}

function makeCoordinateArc(color: number, dashed = false) {
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.09, gapSize: 0.045, transparent: true, opacity: 0.96, depthWrite: false })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.96, depthWrite: false })
  return new THREE.Line(new THREE.BufferGeometry(), material)
}

function updateCoordinateArc(line: THREE.Line, directions: { east: number; up: number; north: number }[]) {
  line.geometry.dispose()
  line.geometry = new THREE.BufferGeometry().setFromPoints(directions.map((direction) => (
    new THREE.Vector3(direction.east, direction.up, direction.north).multiplyScalar(RADIUS * 1.02)
  )))
  if (line.material instanceof THREE.LineDashedMaterial) line.computeLineDistances()
}

function makeLocalMeridian() {
  const points = Array.from({ length: 181 }, (_, index) => {
    const angle = index / 180 * Math.PI * 2
    return new THREE.Vector3(0, Math.sin(angle), Math.cos(angle)).multiplyScalar(RADIUS * 1.006)
  })
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xb9a4d6, transparent: true, opacity: 0.82, depthWrite: false }),
  )
}

function makeVerticalMarker(color: number, elevation: number) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 10),
    new THREE.MeshBasicMaterial({ color, depthWrite: false }),
  )
  marker.position.set(0, elevation * RADIUS * 1.012, 0)
  marker.renderOrder = 4
  return marker
}

function makeCircumpolarRegion() {
  const region = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0xe5b879,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  const boundary = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf0c989, transparent: true, opacity: 0.58, depthWrite: false }),
  )
  region.renderOrder = 1
  boundary.renderOrder = 2
  return { region, boundary }
}

function updateCircumpolarRegion(region: THREE.Mesh, boundary: THREE.LineLoop, date: Date, latitude: number) {
  if (latitude === 0) {
    region.visible = false
    boundary.visible = false
    return
  }

  const hemisphere = Math.sign(latitude)
  const boundaryDeclination = hemisphere * (90 - Math.abs(latitude))
  const steps = 96
  const ring = Array.from({ length: steps }, (_, index) => (
    toHorizonVector(index / steps * 360, boundaryDeclination, date, latitude, 1)
  ))
  const pole = toHorizonVector(0, hemisphere * 90, date, latitude, 1)
  const trianglePositions: number[] = []
  const radialSteps = 8
  const surfaceRings = Array.from({ length: radialSteps + 1 }, (_, radialIndex) => (
    ring.map((edgePoint) => pole.clone().lerp(edgePoint, radialIndex / radialSteps).normalize().multiplyScalar(RADIUS * 1.004))
  ))
  for (let radialIndex = 0; radialIndex < radialSteps; radialIndex += 1) {
    const innerRing = surfaceRings[radialIndex]
    const outerRing = surfaceRings[radialIndex + 1]
    for (let index = 0; index < steps; index += 1) {
      const next = (index + 1) % steps
      trianglePositions.push(
        ...innerRing[index].toArray(),
        ...outerRing[index].toArray(),
        ...outerRing[next].toArray(),
        ...innerRing[index].toArray(),
        ...outerRing[next].toArray(),
        ...innerRing[next].toArray(),
      )
    }
  }

  region.geometry.dispose()
  region.geometry = new THREE.BufferGeometry()
  region.geometry.setAttribute('position', new THREE.Float32BufferAttribute(trianglePositions, 3))
  region.geometry.computeBoundingSphere()
  boundary.geometry.dispose()
  boundary.geometry = new THREE.BufferGeometry().setFromPoints(ring.map((point) => point.clone().multiplyScalar(RADIUS * 1.004)))
  boundary.geometry.computeBoundingSphere()
  region.visible = true
  boundary.visible = true
}

export function SphereView({
  date,
  latitude,
  selectedStarId,
  showGrid,
  showConstellations,
  showCoordinates,
  showSphereReferences,
  constellationPairs,
  resetToken,
  onSelectStar,
}: SphereViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const coordinateLabelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const sphereReferenceLabelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const poleLabelRef = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<SphereScene | null>(null)
  const selectRef = useRef(onSelectStar)
  const showCoordinatesRef = useRef(showCoordinates)
  const showSphereReferencesRef = useRef(showSphereReferences)
  const latitudeRef = useRef(latitude)

  useEffect(() => { selectRef.current = onSelectStar }, [onSelectStar])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#142f30')
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80)
    camera.position.set(0, 2.15, 8.2)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.minDistance = 5.4
    controls.maxDistance = 10.5
    controls.maxPolarAngle = Math.PI * 0.88

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x244544, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }),
    )
    scene.add(globe)

    const grid = makeGrid()
    scene.add(grid)

    const horizonPoints: THREE.Vector3[] = []
    for (let step = 0; step <= 180; step += 1) {
      const azimuth = step / 180 * Math.PI * 2
      horizonPoints.push(new THREE.Vector3(RADIUS * Math.sin(azimuth), 0, RADIUS * Math.cos(azimuth)))
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(horizonPoints),
      new THREE.LineBasicMaterial({ color: 0xd6eee1, transparent: true, opacity: 0.85 }),
    ))

    const equator = makeEquator()
    scene.add(equator)
    const pole = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({ color: 0x9bd5c6, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.76 }),
    )
    scene.add(pole)

    const meridian = makeLocalMeridian()
    const zenithMarker = makeVerticalMarker(0xf2c879, 1)
    const nadirMarker = makeVerticalMarker(0x9fc9e9, -1)
    scene.add(meridian, zenithMarker, nadirMarker)
    const { region: circumpolarRegion, boundary: circumpolarBoundary } = makeCircumpolarRegion()
    scene.add(circumpolarRegion, circumpolarBoundary)

    const constellations = lineSegments([], 0xe3bb7b, 0.72)
    scene.add(constellations)

    const coordinateArcs = {
      altitude: makeCoordinateArc(0xf28e78),
      rightAscension: makeCoordinateArc(0xf1c56f, true),
      declination: makeCoordinateArc(0x79d7c5),
    }
    Object.values(coordinateArcs).forEach((arc) => scene.add(arc))

    const starMeshes = new Map<string, THREE.Mesh>()
    for (const star of STARS) {
      const size = 0.036 + Math.max(-1.5, 2 - star.magnitude) * 0.009
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 12, 10),
        new THREE.MeshBasicMaterial({ color: star.color, transparent: true, opacity: 0.95, depthWrite: false }),
      )
      mesh.userData.starId = star.id
      starMeshes.set(star.id, mesh)
      scene.add(mesh)
    }

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.009, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x8fe1cc, transparent: true, opacity: 0.95, depthWrite: false }),
    )
    scene.add(halo)

    const backgroundPositions: number[] = []
    for (let index = 0; index < 180; index += 1) {
      const y = 1 - 2 * (index + 0.5) / 180
      const ringRadius = Math.sqrt(1 - y * y)
      const angle = index * 2.39996
      backgroundPositions.push(Math.cos(angle) * ringRadius * 17, y * 17, Math.sin(angle) * ringRadius * 17)
    }
    scene.add(new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(backgroundPositions, 3)),
      new THREE.PointsMaterial({ color: 0xa3c4bd, size: 0.025, transparent: true, opacity: 0.38, sizeAttenuation: true, depthWrite: false }),
    ))

    const poleLabel = poleLabelRef.current
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerStart: { x: number; y: number } | null = null
    const handlePointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY } }
    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects([...starMeshes.values()])[0]
      if (hit?.object.userData.starId) selectRef.current(hit.object.userData.starId as string)
      pointerStart = null
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)

    const coordinateLabels = coordinateLabelRefs.current
    const sphereReferenceLabels = sphereReferenceLabelRefs.current
    const coordinateAnchors = {
      altitude: new THREE.Vector3(),
      rightAscension: new THREE.Vector3(),
      declination: new THREE.Vector3(),
    }
    const elements: SphereScene = {
      renderer, controls, starMeshes, halo, equator, pole, grid, constellations,
      coordinateArcs, coordinateAnchors, animationFrame: 0,
      meridian, zenithMarker, nadirMarker,
      circumpolarRegion, circumpolarBoundary,
    }
    sceneRef.current = elements
    const draw = () => {
      controls.update()
      renderer.render(scene, camera)
      for (let index = 0; index < COORDINATE_NAMES.length; index += 1) {
        const label = coordinateLabels[index]
        if (!label) continue
        const coordinateName = COORDINATE_NAMES[index]
        const arc = coordinateArcs[coordinateName]
        const positionAttribute = arc.geometry.getAttribute('position')
        if (!positionAttribute) {
          label.style.visibility = 'hidden'
          continue
        }
        let anchor = coordinateAnchors[coordinateName].clone().project(camera)
        let nearestVisibleDistance = Number.POSITIVE_INFINITY
        for (let pointIndex = 0; pointIndex < positionAttribute.count; pointIndex += 1) {
          const candidate = new THREE.Vector3().fromBufferAttribute(positionAttribute, pointIndex).project(camera)
          if (candidate.z < -1 || candidate.z > 1 || Math.abs(candidate.x) > 1 || Math.abs(candidate.y) > 1) continue
          const distance = candidate.x ** 2 + candidate.y ** 2
          if (distance < nearestVisibleDistance) {
            anchor = candidate
            nearestVisibleDistance = distance
          }
        }
        const x = (anchor.x + 1) * container.clientWidth / 2
        const y = (1 - anchor.y) * container.clientHeight / 2
        label.style.visibility = showCoordinatesRef.current && nearestVisibleDistance < Number.POSITIVE_INFINITY ? 'visible' : 'hidden'
        label.style.left = `${Math.max(4, Math.min(container.clientWidth - label.offsetWidth - 4, x + 8))}px`
        label.style.top = `${Math.max(4, Math.min(container.clientHeight - label.offsetHeight - 4, y - label.offsetHeight / 2))}px`
      }
      for (let index = 0; index < SPHERE_REFERENCE_NAMES.length; index += 1) {
        const label = sphereReferenceLabels[index]
        if (!label) continue
        const referenceName = SPHERE_REFERENCE_NAMES[index]
        let anchor: THREE.Vector3
        let visible = true
        if (referenceName === 'zenith') {
          anchor = new THREE.Vector3(0, RADIUS * 1.012, 0).project(camera)
        } else if (referenceName === 'nadir') {
          anchor = new THREE.Vector3(0, -RADIUS * 1.012, 0).project(camera)
        } else {
          const positionAttribute = meridian.geometry.getAttribute('position')
          let nearestVisibleDistance = Number.POSITIVE_INFINITY
          anchor = new THREE.Vector3()
          for (let pointIndex = 0; pointIndex < positionAttribute.count; pointIndex += 1) {
            const candidate = new THREE.Vector3().fromBufferAttribute(positionAttribute, pointIndex).project(camera)
            if (candidate.z < -1 || candidate.z > 1 || Math.abs(candidate.x) > 1 || Math.abs(candidate.y) > 1) continue
            const distance = candidate.x ** 2 + candidate.y ** 2
            if (distance < nearestVisibleDistance) {
              anchor = candidate
              nearestVisibleDistance = distance
            }
          }
          visible = nearestVisibleDistance < Number.POSITIVE_INFINITY
        }
        const x = (anchor.x + 1) * container.clientWidth / 2
        const y = (1 - anchor.y) * container.clientHeight / 2
        label.style.visibility = showSphereReferencesRef.current && visible && anchor.z < 1 ? 'visible' : 'hidden'
        label.style.left = `${Math.max(4, Math.min(container.clientWidth - label.offsetWidth - 4, x + 8))}px`
        label.style.top = `${Math.max(4, Math.min(container.clientHeight - label.offsetHeight - 4, y - label.offsetHeight / 2))}px`
        }
      if (poleLabel) {
        const currentLatitude = latitudeRef.current
        const polePosition = new THREE.Vector3(
          0,
          Math.sin(THREE.MathUtils.degToRad(currentLatitude)) * RADIUS * 1.018,
          Math.cos(THREE.MathUtils.degToRad(currentLatitude)) * RADIUS * 1.018,
        ).project(camera)
        const width = container.clientWidth
        const height = container.clientHeight
        const labelWidth = poleLabel.offsetWidth
        const labelHeight = poleLabel.offsetHeight
        const poleX = (polePosition.x + 1) * width / 2
        const poleY = (1 - polePosition.y) * height / 2
        const labelX = poleX + labelWidth + 12 < width ? poleX + 12 : poleX - labelWidth - 12
        const labelY = Math.max(4, Math.min(height - labelHeight - 4, poleY - labelHeight / 2))
        poleLabel.style.visibility = polePosition.z < 1 ? 'visible' : 'hidden'
        poleLabel.style.left = `${labelX}px`
        poleLabel.style.top = `${labelY}px`
      }
      elements.animationFrame = window.requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.cancelAnimationFrame(elements.animationFrame)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      sceneRef.current = null
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
    }
  }, [])

  useEffect(() => {
    showCoordinatesRef.current = showCoordinates
    showSphereReferencesRef.current = showSphereReferences
    latitudeRef.current = latitude
    const elements = sceneRef.current
    if (!elements) return

    const equatorPositions = elements.equator.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let index = 0; index <= EQUATOR_POINTS; index += 1) {
      const point = toHorizonVector(index / EQUATOR_POINTS * 360, 0, date, latitude, RADIUS * 0.995)
      equatorPositions.setXYZ(index, point.x, point.y, point.z)
    }
    equatorPositions.needsUpdate = true
    elements.equator.geometry.computeBoundingSphere()

    const polePositions = elements.pole.geometry.getAttribute('position') as THREE.BufferAttribute
    polePositions.setXYZ(0, 0, 0, 0)
    polePositions.setXYZ(1, 0, Math.sin(THREE.MathUtils.degToRad(latitude)) * RADIUS, Math.cos(THREE.MathUtils.degToRad(latitude)) * RADIUS)
    polePositions.needsUpdate = true
    elements.pole.geometry.computeBoundingSphere()
    elements.pole.computeLineDistances()
    const starPositions = new Map<string, THREE.Vector3>()
    for (const star of STARS) {
      const horizontal = equatorialToHorizontal(star.ra, star.dec, date, latitude)
      const point = new THREE.Vector3(horizontal.east, horizontal.up, horizontal.north).multiplyScalar(RADIUS * 1.008)
      starPositions.set(star.id, point)
      const mesh = elements.starMeshes.get(star.id)
      if (!mesh) continue
      mesh.position.copy(point)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = horizontal.altitude >= 0 ? 0.96 : 0.2
    }

    elements.halo.position.copy(starPositions.get(selectedStarId) ?? new THREE.Vector3())
    elements.halo.lookAt(0, 0, 0)
    elements.grid.visible = showGrid
    elements.meridian.visible = showSphereReferences
    elements.zenithMarker.visible = showSphereReferences
    elements.nadirMarker.visible = showSphereReferences
    const selectedStar = STARS.find((star) => star.id === selectedStarId)
    if (selectedStar) {
      const paths = getCoordinatePaths(selectedStar.ra, selectedStar.dec, date, latitude)
      for (const coordinateName of COORDINATE_NAMES) {
        const directions = paths[coordinateName]
        updateCoordinateArc(elements.coordinateArcs[coordinateName], directions)
        const middle = directions[Math.floor(directions.length / 2)]
        elements.coordinateAnchors[coordinateName].set(middle.east, middle.up, middle.north).multiplyScalar(RADIUS * 1.02)
        elements.coordinateArcs[coordinateName].visible = showCoordinates
      }
    }
    updateCircumpolarRegion(elements.circumpolarRegion, elements.circumpolarBoundary, date, latitude)

    const segments: number[] = []
    for (const [firstId, secondId] of constellationPairs) {
      const first = starPositions.get(firstId)
      const second = starPositions.get(secondId)
      if (first && second) segments.push(...first.toArray(), ...second.toArray())
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3))
    elements.constellations.geometry.dispose()
    elements.constellations.geometry = geometry
    elements.constellations.visible = showConstellations
  }, [date, latitude, selectedStarId, showGrid, showConstellations, showCoordinates, showSphereReferences, constellationPairs])

  useEffect(() => { sceneRef.current?.controls.reset() }, [resetToken])

  const selectedStar = STARS.find((star) => star.id === selectedStarId) ?? STARS[0]
  const selectedPosition = equatorialToHorizontal(selectedStar.ra, selectedStar.dec, date, latitude)
  const coordinateLabels = [
    `ALTITUDE ${Math.round(selectedPosition.altitude)}° · HORIZON`,
    `RIGHT ASCENSION ${(selectedStar.ra / 15).toFixed(2)}h · VERNAL EQUINOX`,
    `DECLINATION ${selectedStar.dec > 0 ? '+' : ''}${selectedStar.dec.toFixed(1)}° · CELESTIAL EQUATOR`,
  ]
  const circumpolarPole = latitude === 0 ? 'no circumpolar region at the equator' : `${latitude > 0 ? 'north' : 'south'} circumpolar sky region highlighted`

  return (
    <div ref={containerRef} className="sphere-canvas" role="img" aria-label={`Interactive celestial sphere showing bright stars, horizon, altitude grid, celestial equator, and ${circumpolarPole}`}>
      {coordinateLabels.map((label, index) => (
        <span
          key={COORDINATE_NAMES[index]}
          ref={(element) => { coordinateLabelRefs.current[index] = element }}
          className={`coordinate-callout coordinate-callout-${COORDINATE_NAMES[index]}`}
          aria-hidden="true"
        >{label}</span>
      ))}
      {SPHERE_REFERENCE_NAMES.map((referenceName, index) => (
        <span
          key={referenceName}
          ref={(element) => { sphereReferenceLabelRefs.current[index] = element }}
          className={`sphere-reference-label sphere-reference-label-${referenceName}`}
          aria-hidden="true"
        >{referenceName === 'meridian' ? 'LOCAL MERIDIAN' : referenceName.toUpperCase()}</span>
      ))}
      <span ref={poleLabelRef} className="pole-position-label" aria-hidden="true">
        <span>NORTH CELESTIAL POLE</span>
        <b>{latitude === 0 ? 'FIXED · ON HORIZON' : `FIXED · ${Math.abs(latitude)}° ${latitude > 0 ? 'ABOVE' : 'BELOW'} HORIZON`}</b>
      </span>
    </div>
  )
}
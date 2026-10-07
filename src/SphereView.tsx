import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { equatorialToHorizontal, STARS } from './astronomy'

const RADIUS = 3.2
const EQUATOR_POINTS = 160

interface SphereViewProps {
  date: Date
  latitude: number
  selectedStarId: string
  showGrid: boolean
  showConstellations: boolean
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

export function SphereView({
  date,
  latitude,
  selectedStarId,
  showGrid,
  showConstellations,
  constellationPairs,
  resetToken,
  onSelectStar,
}: SphereViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SphereScene | null>(null)
  const selectRef = useRef(onSelectStar)

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

    const constellations = lineSegments([], 0xe3bb7b, 0.72)
    scene.add(constellations)

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

    const elements: SphereScene = { renderer, controls, starMeshes, halo, equator, pole, grid, constellations, animationFrame: 0 }
    sceneRef.current = elements
    const draw = () => {
      controls.update()
      renderer.render(scene, camera)
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
  }, [date, latitude, selectedStarId, showGrid, showConstellations, constellationPairs])

  useEffect(() => { sceneRef.current?.controls.reset() }, [resetToken])

  return <div ref={containerRef} className="sphere-canvas" role="img" aria-label="Interactive celestial sphere showing bright stars, horizon, altitude grid, celestial equator, and north celestial pole" />
}
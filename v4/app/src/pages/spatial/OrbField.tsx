/* eslint-disable react-hooks/purity --
   Orb positions/colors are precomputed once (useMemo) and instance matrices
   are composed per-frame inside useFrame — the idiomatic React Three Fiber
   pattern (react-dev.md). */
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 300
const SHELL_R = 5.4

/**
 * Spatial §1 hero — orb field: ~300 luminous orbs on a spherical shell,
 * slow 30s/rev orbital drift; orbs near the pointer brighten + swell;
 * pointer parallax rotates the shell ±8° with 0.3s lag (simulated head turn).
 */
function OrbShell() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const lag = useRef({ x: 0, y: 0 })

  const { positions, colors, delays } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const delays = new Float32Array(COUNT)
    const wave = new THREE.Color('#2EE6D6')
    const pulse = new THREE.Color('#7C5CFF')
    const spark = new THREE.Color('#FFB224')
    let rMin = Infinity
    let rMax = -Infinity
    const radii: number[] = []
    // fibonacci sphere
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2
      const rr = Math.sqrt(1 - y * y)
      const theta = golden * i
      const radius = SHELL_R + (Math.random() - 0.5) * 1.6
      positions[i * 3] = Math.cos(theta) * rr * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = Math.sin(theta) * rr * radius
      radii.push(radius)
      rMin = Math.min(rMin, radius)
      rMax = Math.max(rMax, radius)
      const pick = Math.random()
      const c = pick < 0.6 ? wave : pick < 0.9 ? pulse : spark
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    for (let i = 0; i < COUNT; i++) delays[i] = ((radii[i] - rMin) / (rMax - rMin)) * 0.7
    return { positions, colors, delays }
  }, [])

  const ray = useMemo(() => new THREE.Vector3(), [])
  const orbDir = useMemo(() => new THREE.Vector3(), [])
  const camPos = useMemo(() => new THREE.Vector3(), [])
  const colorTmp = useMemo(() => new THREE.Color(), [])
  const white = useMemo(() => new THREE.Color('#EAFDFB'), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const g = group.current
    const m = mesh.current
    if (!g || !m) return

    // orbital drift 30s/rev + pointer parallax ±8° with 0.3s lag
    const targetX = -state.pointer.y * 0.14
    const targetY = state.pointer.x * 0.14
    const k = 1 - Math.exp(-dt / 0.3)
    lag.current.x += (targetX - lag.current.x) * k
    lag.current.y += (targetY - lag.current.y) * k
    g.rotation.y = (t * Math.PI * 2) / 30 + lag.current.y
    g.rotation.x = lag.current.x

    // pointer ray direction (world), pulled into group-local space
    ray.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
    camPos.copy(state.camera.position)
    ray.sub(camPos).normalize()
    const inv = g.quaternion.clone().invert()
    ray.applyQuaternion(inv)

    for (let i = 0; i < COUNT; i++) {
      // entrance: scale 0→1 staggered by shell radius over ~1.6s
      const intro = THREE.MathUtils.smoothstep(t - delays[i], 0, 0.9)
      orbDir.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]).normalize()
      const align = orbDir.dot(ray) // 1 = directly where the "head" looks
      const near = THREE.MathUtils.smoothstep(align, 0.82, 0.98)
      const s = (0.55 + near * 1.1) * intro
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      dummy.scale.setScalar(Math.max(s, 0.0001))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      colorTmp.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      if (near > 0.02) colorTmp.lerp(white, near * 0.55)
      m.setColorAt(i, colorTmp)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export default function OrbField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <OrbShell />
    </Canvas>
  )
}

/* eslint-disable react-hooks/purity, react-hooks/immutability --
   R3F particle buffers are precomputed once (useMemo) and mutated per-frame
   inside useFrame — the idiomatic React Three Fiber pattern (react-dev.md). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 4000
const BANDS = 64

/**
 * Aurora Field — ~4,000 particles in a breathing waveform ring (design.md §7.1).
 * Simulated 64-band spectrum displaces particle radius; pointer repels particles.
 */
function ParticleRing() {
  const pointsRef = useRef<THREE.Points>(null)
  const pointer = useRef({ x: 999, y: 999 })
  const time = useRef(0)

  const { geometry, base, bands, disp } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const base = new Float32Array(COUNT * 3) // angle, radius, z-jitter
    const bands = new Float32Array(BANDS).fill(0.3)
    const disp = new Float32Array(COUNT * 2)

    const violet = new THREE.Color('#7C5CFF')
    const cyan = new THREE.Color('#2EE6D6')
    const magenta = new THREE.Color('#FF3D8A')
    const tmp = new THREE.Color()

    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 2.9 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.45
      base[i * 3] = a
      base[i * 3 + 1] = r
      base[i * 3 + 2] = (Math.random() - 0.5) * 0.6

      const bandT = a / (Math.PI * 2)
      if (bandT < 0.5) tmp.lerpColors(violet, cyan, bandT * 2)
      else tmp.lerpColors(cyan, magenta, (bandT - 0.5) * 2)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, base, bands, disp }
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      geometry.dispose()
    }
  }, [geometry])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    time.current += dt
    const t = time.current

    // simulated spectrum: bands lerp toward sine-noise targets (~24fps feel)
    for (let b = 0; b < BANDS; b++) {
      const bass = 1 - (b / BANDS) * 0.5
      const target =
        (0.28 + 0.72 * Math.abs(Math.sin(t * 1.7 + b * 0.6) * Math.sin(t * 0.9 + b * 0.23))) * bass
      bands[b] += (target - bands[b]) * 0.18
    }

    // pointer world position (approx, plane z = 0, camera z = 8, fov 55)
    const halfH = Math.tan(THREE.MathUtils.degToRad(55 / 2)) * 8
    const halfW = halfH * (state.size.width / state.size.height)
    const px = pointer.current.x * halfW
    const py = pointer.current.y * halfH

    const positions = geometry.attributes.position.array as Float32Array
    const breath = 1 + 0.05 * Math.sin(t * 0.6)

    for (let i = 0; i < COUNT; i++) {
      const a = base[i * 3]
      const r = base[i * 3 + 1]
      const z0 = base[i * 3 + 2]
      const bi = Math.min(BANDS - 1, Math.floor((a / (Math.PI * 2)) * BANDS))

      const wobble = 0.06 * Math.sin(t * 1.1 + i * 0.7)
      const rr = (r + bands[bi] * 0.55 + wobble) * breath
      let x = Math.cos(a) * rr
      let y = Math.sin(a) * rr * 0.62

      // pointer repulsion with lerp decay
      const dx = x - px
      const dy = y - py
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 1.2 && d > 0.0001) {
        const f = ((1.2 - d) / 1.2) * 0.35
        disp[i * 2] += (dx / d) * f
        disp[i * 2 + 1] += (dy / d) * f
      }
      disp[i * 2] *= 0.95
      disp[i * 2 + 1] *= 0.95
      x += disp[i * 2]
      y += disp[i * 2 + 1]

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z0 + 0.15 * Math.sin(t * 0.5 + i)
    }
    geometry.attributes.position.needsUpdate = true

    if (pointsRef.current) pointsRef.current.rotation.z = t * 0.02
  })

  return (
    <points ref={pointsRef} geometry={geometry} rotation={[0.35, 0, -0.08]}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Lazy-mounted canvas wrapper; pauses offscreen; null when WebGL unsupported */
export default function AuroraField() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [supported] = useState(webglAvailable)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '10%',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!supported) return null
  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <Canvas
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <ParticleRing />
      </Canvas>
    </div>
  )
}

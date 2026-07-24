import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './Navbar'
import Footer from './Footer'
import PulseBar from './PulseBar'
import CustomCursor from './CustomCursor'
import ScrollProgress from './ScrollProgress'
import GrainOverlay from './GrainOverlay'
import PageWipe from './PageWipe'
import { getLenis, setLenis } from '@/lib/scroll'

gsap.registerPlugin(ScrollTrigger)

/**
 * Shared shell (nested-route pattern — renders <Outlet/>).
 * Navbar is fixed (overlay over heroes), so the content slot owns the
 * matching 76px top offset; pages never compensate for nav height.
 */
export default function Layout() {
  const { pathname } = useLocation()

  // Lenis smooth scroll, synced with GSAP ScrollTrigger (design.md §6)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    getLenis()?.scrollTo(0, { immediate: true })
  }, [pathname])

  return (
    <div className="relative min-h-[100dvh] bg-void text-ghost">
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <PageWipe />
      <main className="pt-[76px]">
        <Outlet />
      </main>
      <Footer />
      <PulseBar />
      <GrainOverlay />
    </div>
  )
}

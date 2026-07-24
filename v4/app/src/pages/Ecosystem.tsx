import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import OrbitHero from './ecosystem/OrbitHero'
import HandoffStage from './ecosystem/HandoffStage'
import Wearables from './ecosystem/Wearables'
import Integrations from './ecosystem/Integrations'
import Developers from './ecosystem/Developers'
import CompatibilityGrid from './ecosystem/CompatibilityGrid'
import CtaBand from './ecosystem/CtaBand'
import { getLenis } from '@/lib/scroll'

/** /ecosystem — device constellation, session handoff, integrations, developers */
export default function Ecosystem() {
  const { hash } = useLocation()

  useEffect(() => {
    document.title = 'Ecosystem — Every device. One pulse. | manosli+'
  }, [])

  // honor deep links like /ecosystem#developers (footer)
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => {
      const el = document.querySelector(hash)
      if (!(el instanceof HTMLElement)) return
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(el, { offset: -76 })
      else el.scrollIntoView({ behavior: 'smooth' })
    }, 500)
    return () => window.clearTimeout(t)
  }, [hash])

  return (
    <>
      <OrbitHero />
      <HandoffStage />
      <Wearables />
      <Integrations />
      <Developers />
      <CompatibilityGrid />
      <CtaBand />
    </>
  )
}

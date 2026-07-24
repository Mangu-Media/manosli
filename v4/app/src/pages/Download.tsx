import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DownloadHero from './download/DownloadHero'
import PlatformCards from './download/PlatformCards'
import Plans from './download/Plans'
import CompareTable from './download/CompareTable'
import EarlyAccess from './download/EarlyAccess'
import PressKit from './download/PressKit'
import Faq from './download/Faq'
import Closing from './download/Closing'
import { getLenis } from '@/lib/scroll'

/** /download — platform downloads, plans, early access, press kit, FAQ */
export default function Download() {
  const { hash } = useLocation()

  useEffect(() => {
    document.title = 'Get manosli+ — Press play on the future'
  }, [])

  // honor deep links like /download#plans and /download#press (footer)
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
      <DownloadHero />
      <PlatformCards />
      <Plans />
      <CompareTable />
      <EarlyAccess />
      <PressKit />
      <Faq />
      <Closing />
    </>
  )
}

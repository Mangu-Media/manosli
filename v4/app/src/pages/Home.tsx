import { useState } from 'react'
import { motion } from 'framer-motion'
import Preloader from '@/components/Preloader'
import Marquee from '@/components/Marquee'
import Hero from './home/Hero'
import Pillars from './home/Pillars'
import AdaptiveStory from './home/AdaptiveStory'
import StatsBand from './home/StatsBand'
import Triptych from './home/Triptych'
import QuoteBand from './home/QuoteBand'
import FinalCta from './home/FinalCta'

const MARQUEE_ITEMS = [
  'ON-DEVICE INTELLIGENCE',
  'ZERO-KNOWLEDGE',
  'FEDERATED LEARNING',
  'SPATIAL AUDIO',
  'IPFS CATALOG',
  'RUST + WASM',
  '<40MS SYNC',
  'AR / VR READY',
  'NO TRACKING',
]

export default function Home() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Hero active={ready} />
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.8 }}>
        <Marquee items={MARQUEE_ITEMS} />
      </motion.div>
      <Pillars />
      <AdaptiveStory />
      <StatsBand />
      <Triptych />
      <QuoteBand />
      <FinalCta />
    </>
  )
}

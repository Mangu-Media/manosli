import { useEffect } from 'react'
import TechHero from './technology/TechHero'
import Architecture from './technology/Architecture'
import Benchmarks from './technology/Benchmarks'
import GrpcStreams from './technology/GrpcStreams'
import FederationStory from './technology/FederationStory'
import ModelCards from './technology/ModelCards'
import CatalogRace from './technology/CatalogRace'
import SpecSheet from './technology/SpecSheet'
import TechCta from './technology/TechCta'
import { ToastHost } from './technology/toast'

/** /technology — Engineered like infrastructure (design/technology.md) */
export default function Technology() {
  useEffect(() => {
    document.title = 'The Technology — Engineered like infrastructure | manosli+'
    return () => {
      document.title = 'manosli+ — Sound, understood.'
    }
  }, [])

  return (
    <>
      <TechHero />
      <Architecture />
      <Benchmarks />
      <GrpcStreams />
      <FederationStory />
      <ModelCards />
      <CatalogRace />
      <SpecSheet />
      <TechCta />
      <ToastHost />
    </>
  )
}

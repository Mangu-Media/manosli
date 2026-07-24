import Hero from './spatial/Hero'
import SpatialStage from './spatial/SpatialStage'
import ArVisual from './spatial/ArVisual'
import Environments from './spatial/Environments'
import Hardware from './spatial/Hardware'
import SpecStrip from './spatial/SpecStrip'
import SpatialCta from './spatial/SpatialCta'
import './spatial/spatial.css'

/** /spatial — Spatial Audio & AR (design/spatial.md) */
export default function Spatial() {
  return (
    <>
      <Hero />
      <SpatialStage />
      <ArVisual />
      <Environments />
      <Hardware />
      <SpecStrip />
      <SpatialCta />
    </>
  )
}

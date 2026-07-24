import { useEffect } from 'react'
import PrivacyHero from './privacy/PrivacyHero'
import PrivacyStack from './privacy/PrivacyStack'
import TelemetryToggles from './privacy/TelemetryToggles'
import ByteJourney from './privacy/ByteJourney'
import OnDevice from './privacy/OnDevice'
import Manifest from './privacy/Manifest'
import Commitments from './privacy/Commitments'
import PrivacyFaq from './privacy/PrivacyFaq'
import PrivacyCta from './privacy/PrivacyCta'
import { ToastHost } from './technology/toast'

/** /privacy — Zero-Knowledge Privacy (design/privacy.md) */
export default function Privacy() {
  useEffect(() => {
    document.title = 'Zero-Knowledge Privacy — Your music. Your data. Period. | manosli+'
    return () => {
      document.title = 'manosli+ — Sound, understood.'
    }
  }, [])

  return (
    <>
      <PrivacyHero />
      <PrivacyStack />
      <TelemetryToggles />
      <ByteJourney />
      <OnDevice />
      <Manifest />
      <Commitments />
      <PrivacyFaq />
      <PrivacyCta />
      <ToastHost />
    </>
  )
}

import Hero from './social/Hero'
import SyncEngine from './social/SyncEngine'
import LiveRoom from './social/LiveRoom'
import CoCuration from './social/CoCuration'
import Rooms from './social/Rooms'
import PrivacyBand from './social/PrivacyBand'
import Moments from './social/Moments'
import SocialCta from './social/SocialCta'
import './social/social.css'

/** /social — Together: Social Listening (design/social.md) */
export default function Social() {
  return (
    <>
      <Hero />
      <SyncEngine />
      <LiveRoom />
      <CoCuration />
      <Rooms />
      <PrivacyBand />
      <Moments />
      <SocialCta />
    </>
  )
}

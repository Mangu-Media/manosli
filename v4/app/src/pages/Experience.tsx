import ExperienceHero from './experience/ExperienceHero'
import ContextStory from './experience/ContextStory'
import MoodEngine from './experience/MoodEngine'
import VoiceConsole from './experience/VoiceConsole'
import DayArc from './experience/DayArc'
import FreshPlaylists from './experience/FreshPlaylists'
import Accessible from './experience/Accessible'
import ExperienceCta from './experience/ExperienceCta'

/**
 * The Experience — adaptive context UI, on-device Mood Engine, offline voice
 * NLU, a scroll-scored day arc, and hourly-regenerated playlists
 * (design: experience.md; route /experience).
 */
export default function Experience() {
  return (
    <>
      <ExperienceHero />
      <ContextStory />
      <MoodEngine />
      <VoiceConsole />
      <DayArc />
      <FreshPlaylists />
      <Accessible />
      <ExperienceCta />
    </>
  )
}

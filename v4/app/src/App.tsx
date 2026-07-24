import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Experience from './pages/Experience'
import Technology from './pages/Technology'
import Privacy from './pages/Privacy'
import Social from './pages/Social'
import Spatial from './pages/Spatial'
import Ecosystem from './pages/Ecosystem'
import Download from './pages/Download'
import NotFound from './pages/NotFound'
import PlayerApp from './pages/PlayerApp'
import StudioApp from './pages/StudioApp'
import ArtistProfile from './pages/ArtistProfile'

export default function App() {
  return (
    <Routes>
      <Route path="app" element={<PlayerApp />} />
      <Route path="studio" element={<StudioApp />} />
      <Route path="artist/:id" element={<ArtistProfile />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="experience" element={<Experience />} />
        <Route path="technology" element={<Technology />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="social" element={<Social />} />
        <Route path="spatial" element={<Spatial />} />
        <Route path="ecosystem" element={<Ecosystem />} />
        <Route path="download" element={<Download />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

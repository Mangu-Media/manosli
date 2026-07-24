// ─────────────────────────────────────────────
// DATA LAYER — Every track, album, artist, playlist
// ─────────────────────────────────────────────
//
// Audio: all tracks are real recordings by Kevin MacLeod (incompetech.com),
// licensed under Creative Commons: By Attribution 4.0
// (https://creativecommons.org/licenses/by/4.0/).
// Several catalog tracks share one audio file (per-album mapping);
// `duration` is each mapped file's real duration measured with ffprobe.

export interface Artist {
  id: string;
  name: string;
  image: string; // emoji fallback
  genre: string;
  followers: string;
  bio: string;
  longBio?: string; // extended bio for the public artist profile (/artist/:id)
  color: string;
  artwork?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistName: string;
  year: number;
  cover: string; // emoji fallback
  color: string;
  tracks: number;
  artwork?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number; // seconds — real duration of the mapped audio file
  plays: string;
  audioUrl: string;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  color: string;
  tracks: string[];
}

// manosli+ design tokens (tailwind.config.js) reused for inline styles
export const theme = {
  bg: '#06030B', // void
  abyss: '#0C0714', // abyss
  surface: '#130B21', // panel
  surfaceHover: '#1C1230', // between panel and line
  surfaceActive: '#241A38', // line
  border: '#241A38', // line
  text: '#F5F2FB', // ghost
  textSecondary: '#A79FBE', // mist
  dim: '#6E6584', // smoke
  accent: '#7C5CFF', // pulse
  accentHover: '#6A4BEF',
  pink: '#FF3D8A', // beat
  green: '#2EE6D6', // wave
  amber: '#FFB224', // spark
};

export const ARTISTS: Artist[] = [
  { id: 'a1', name: 'Nora Veil', image: '🎤', genre: 'Electronic', followers: '2.4M', bio: 'Berlin-based electronic producer blending ambient textures with driving beats.', longBio: 'Nora Veil came up through Berlin\'s after-hours scene, soldering modular synths in a Kreuzberg basement before her first EP lit up underground radio. Her sound pairs glacial ambient pads with percussion that hits like a heartbeat — music for the last train home and the first light after. Three albums in, she still masters everything herself and publishes her session stems for free, because she believes electronic music should be a conversation, not a product.', color: theme.accent, artwork: '/assets/avatar-01.png' },
  { id: 'a2', name: 'Ghost Meridian', image: '👻', genre: 'Indie', followers: '1.8M', bio: 'Ethereal indie project from Portland, weaving folk melodies into shoegaze walls.', longBio: 'Ghost Meridian began as one voice and a four-track recorder in a rain-soaked Portland attic. The project has grown into a full band, but the method hasn\'t changed: folk songs written on an old nylon-string guitar, then buried alive under layers of reverb-drenched shoegaze guitars. Critics call it "music for fog." The band calls it "honesty with the volume turned up." Every record is tracked live in a decommissioned church, and every stream on manosli+ lands directly in the band\'s shared ledger.', color: theme.pink, artwork: '/assets/avatar-02.png' },
  { id: 'a3', name: 'Sable', image: '🎵', genre: 'R&B', followers: '5.1M', bio: 'Neo-soul vocalist crafting intimate soundscapes that feel like midnight conversations.', longBio: 'Sable sings the way people talk at 2 AM — low, unguarded, a little bit fearless. Raised on gospel choirs and classic soul records, she taught herself production by remaking her favorite albums note for note, then wrote Velvet Hours in a single winter. Her live shows famously ban phones: just a voice, a Rhodes, and a room full of strangers leaving as friends. She chose manosli+ because every cent of every stream reaches her — no middlemen, no mysteries.', color: theme.amber, artwork: '/assets/avatar-03.png' },
  { id: 'a4', name: 'HEXFORM', image: '⚡', genre: 'Techno', followers: '890K', bio: 'Industrial techno from Tokyo. Machines talking to machines.', longBio: 'HEXFORM is a one-person machine orchestra from Tokyo\'s Kōtō ward, built from salvaged factory motors, contact microphones, and a wall of patched Eurorack. Sets are composed in code and performed on hardware — no laptops, no safety net. Machine Hymns was recorded inside an abandoned transformer station during a typhoon. The manifesto is simple: dance music should sound like the world it\'s made in, and the people who dance to it should know exactly where their money goes.', color: theme.green, artwork: '/assets/avatar-04.png' },
  { id: 'a5', name: 'Lumen Choir', image: '✨', genre: 'Classical', followers: '620K', bio: 'Contemporary classical ensemble reimagining baroque for the digital age.', longBio: 'Lumen Choir is a twelve-voice ensemble that treats a 300-year-old chorale and a granular synth patch with equal reverence. Founded by two conservatory dropouts, the group performs baroque repertoire through live electronics — voices stretched, shattered, and reassembled in real time. Glass Cathedral, their breakout record, was tracked in a single continuous take. They publish annotated scores for every piece and split royalties equally among all twelve singers, openly, down to the cent.', color: '#B7A8FF', artwork: '/assets/avatar-05.png' },
  { id: 'a6', name: 'Drift Signals', image: '🌊', genre: 'Ambient', followers: '1.2M', bio: 'Generative ambient compositions inspired by ocean currents and satellite data.', longBio: 'Drift Signals turns live data into slow music. Ocean buoy readings, satellite telemetry, tide tables — all of it feeds custom generative systems that compose endlessly, of which albums like Tidal Memory are carefully chosen excerpts. No two performances are identical, and the project\'s code is fully open source. Half of all earnings fund oceanographic nonprofits; the rest keeps the servers humming. On manosli+, the royalty ledger is public because transparency is the whole point.', color: '#4FB7FF', artwork: '/assets/avatar-06.png' },
  { id: 'a7', name: 'Vanta Black', image: '🖤', genre: 'Hip-Hop', followers: '3.7M', bio: 'Experimental hip-hop from Atlanta. Every beat is a statement.', longBio: 'Vanta Black emerged from Atlanta\'s experimental scene with beats that sound like they were mixed inside a vault — sub-bass you feel in your teeth, samples chopped past recognition, verses that read like dispatches. Obsidian spent eleven weeks atop the manosli+ charts. Offstage, he runs a free production workshop for teenagers and donates a fixed cut of every payout to neighborhood studios. His rule: if the money can\'t be explained in one sentence, the deal is wrong.', color: '#FF6A5C', artwork: '/assets/avatar-01.png' },
  { id: 'a8', name: 'Solaris', image: '☀️', genre: 'Pop', followers: '8.2M', bio: 'Global pop sensation blending Latin rhythms with futuristic production.', longBio: 'Solaris is what happens when cumbia, reggaetón, and chrome-plated future-pop share one studio. Born in Miami, raised on tour buses, she wrote Supernova between festival dates across three continents — and it shows: every track is built for a field full of people at golden hour. She famously left a major-label deal to stay independent, and now publishes her streaming statements publicly so young artists can see what honest numbers look like.', color: '#FF9F2E', artwork: '/assets/avatar-02.png' },
  { id: 'a9', name: 'Mono Palm', image: '🌴', genre: 'Lounge', followers: '740K', bio: 'Poolside lounge and bossa-tinged instrumentals for slow afternoons.', longBio: 'Mono Palm makes music for the hour when the light goes soft. A rotating cast of session players around a core duo, the project blends bossa nova guitar, brushed drums, and vibraphone into instrumentals that feel like a permanent vacation. Sunset Spritz was recorded live around one microphone, cocktails on the piano. The band\'s entire back catalog is mixed for vinyl first — warm, unhurried, and proudly low-stakes.', color: '#9DE85C', artwork: '/assets/avatar-03.png' },
  { id: 'a10', name: 'Brine & Cedar', image: '🪵', genre: 'Folk', followers: '410K', bio: 'Coastal folk duo — hammered strings, sea air, and front-porch stories.', longBio: 'Brine & Cedar are two shipwrights\' kids from the foggy edge of the Pacific Northwest who sing like the tide going out. Their instruments — hammered dulcimer, driftwood-topped guitars, a salvaged pump organ — are built or repaired by their own hands, and their songs carry front-porch stories about gales, gulls, and the people who wait on shore. They tour by sailboat when the season allows, and their manosli+ ledger funds a community boat-building school.', color: '#D9A05B', artwork: '/assets/avatar-04.png' },
  { id: 'a11', name: 'Casino Vermilion', image: '🎰', genre: 'Jazz', followers: '980K', bio: 'Late-night big-band jazz with a noir streak and a brass section that never sleeps.', longBio: 'Casino Vermilion is a thirteen-piece big band scored for a film that doesn\'t exist — smoky trumpet lines, walking bass, and a brass section that swings like it owes somebody money. Bandleader Vera Vermilion arranges everything by hand on paper, then the band cuts each record live to tape in a single night. Case Files plays like a detective novel you can dance to. Every member is an equal partner, and the books are open to anyone who asks.', color: '#FF6AA9', artwork: '/assets/avatar-05.png' },
  { id: 'a12', name: 'Paper Arcade', image: '🕹️', genre: 'Pop', followers: '1.5M', bio: 'Hyperactive chiptune-pop — cartoon chaos pressed to vinyl.', longBio: 'Paper Arcade sounds like a Saturday morning cartoon falling down the stairs — in the best way. Game Boy chips, bubblegum hooks, and breakbeats played by a real, very tired drummer. The duo builds all their own cartridge hardware and prints zines for every release. Jungle Gym Jam became an unlikely streaming hit with the under-ten crowd and the over-thirty nostalgia crowd simultaneously. Their motto: maximum fun, zero gatekeeping, all royalties on the table.', color: theme.green, artwork: '/assets/avatar-06.png' },
  { id: 'a13', name: 'Velvet Menagerie', image: '🦚', genre: 'Electronic', followers: '2.1M', bio: 'Maximalist electronic collages, equal parts disco and daydream.', longBio: 'Velvet Menagerie treats the sampler like a costume trunk: disco strings, fairground organs, snippets of forgotten radio plays, all sewn into maximalist electronic collages. Live, the project expands to a full band with a costume change per song. Confetti Engine took two years and four storage units of vinyl to make. Nothing is minimal, nothing is ironic, and every sample license is listed in the liner notes — royalties visible down to the last interpolated squeak.', color: theme.pink, artwork: '/assets/avatar-01.png' },
  { id: 'a14', name: 'Aria Solenne', image: '🎻', genre: 'Classical', followers: '530K', bio: 'Solo piano miniatures and ambient string studies for quiet rooms.', longBio: 'Aria Solenne writes small music for quiet rooms. A concert pianist who traded recital halls for a home studio with a felted upright, she records miniatures — most under three minutes — layered with close-mic\'d string studies. Three Gymnopédies, her meditation on Satie, found an audience of insomniacs, students, and new parents. She releases one piece a month, sheet music included free, and keeps her royalty statements public so listeners can watch a dollar become a living, slowly.', color: '#B7A8FF', artwork: '/assets/avatar-02.png' },
];

export const ALBUMS: Album[] = [
  { id: 'al1', title: 'Phantom Frequencies', artist: 'a1', artistName: 'Nora Veil', year: 2026, cover: '🌌', color: theme.accent, tracks: 12, artwork: '/assets/album-01.png' },
  { id: 'al2', title: 'Soft Collapse', artist: 'a2', artistName: 'Ghost Meridian', year: 2025, cover: '🍂', color: theme.pink, tracks: 10, artwork: '/assets/album-02.png' },
  { id: 'al3', title: 'Velvet Hours', artist: 'a3', artistName: 'Sable', year: 2026, cover: '🌙', color: theme.amber, tracks: 14, artwork: '/assets/album-03.png' },
  { id: 'al4', title: 'Machine Hymns', artist: 'a4', artistName: 'HEXFORM', year: 2026, cover: '⚙️', color: theme.green, tracks: 8, artwork: '/assets/album-04.png' },
  { id: 'al5', title: 'Glass Cathedral', artist: 'a5', artistName: 'Lumen Choir', year: 2025, cover: '🏛️', color: '#B7A8FF', tracks: 6, artwork: '/assets/album-05.png' },
  { id: 'al6', title: 'Tidal Memory', artist: 'a6', artistName: 'Drift Signals', year: 2026, cover: '🌊', color: '#4FB7FF', tracks: 9, artwork: '/assets/album-06.png' },
  { id: 'al7', title: 'Obsidian', artist: 'a7', artistName: 'Vanta Black', year: 2026, cover: '💎', color: '#FF6A5C', tracks: 16, artwork: '/assets/album-07.png' },
  { id: 'al8', title: 'Supernova', artist: 'a8', artistName: 'Solaris', year: 2026, cover: '🔥', color: '#FF9F2E', tracks: 11, artwork: '/assets/album-08.png' },
  { id: 'al9', title: 'Neon Prayers', artist: 'a1', artistName: 'Nora Veil', year: 2024, cover: '🙏', color: '#9D7CFF', tracks: 10, artwork: '/assets/album-01.png' },
  { id: 'al10', title: 'Echoes of Us', artist: 'a2', artistName: 'Ghost Meridian', year: 2024, cover: '🪞', color: '#FF6AA9', tracks: 8, artwork: '/assets/album-02.png' },
  { id: 'al11', title: 'Sunset Spritz', artist: 'a9', artistName: 'Mono Palm', year: 2026, cover: '🍹', color: '#9DE85C', tracks: 7, artwork: '/assets/album-03.png' },
  { id: 'al12', title: 'Cool Cats Club', artist: 'a9', artistName: 'Mono Palm', year: 2025, cover: '🐈', color: '#7CE8A9', tracks: 6, artwork: '/assets/album-04.png' },
  { id: 'al13', title: 'Timberframe', artist: 'a10', artistName: 'Brine & Cedar', year: 2026, cover: '🔨', color: '#D9A05B', tracks: 9, artwork: '/assets/album-05.png' },
  { id: 'al14', title: 'Gale Songs', artist: 'a10', artistName: 'Brine & Cedar', year: 2025, cover: '🌬️', color: '#8FB7C9', tracks: 5, artwork: '/assets/album-06.png' },
  { id: 'al15', title: 'Case Files', artist: 'a11', artistName: 'Casino Vermilion', year: 2026, cover: '🕵️', color: '#FF6AA9', tracks: 11, artwork: '/assets/album-07.png' },
  { id: 'al16', title: 'Midnight Baccarat', artist: 'a11', artistName: 'Casino Vermilion', year: 2024, cover: '🃏', color: '#C96AFF', tracks: 8, artwork: '/assets/album-08.png' },
  { id: 'al17', title: 'Jungle Gym Jam', artist: 'a12', artistName: 'Paper Arcade', year: 2026, cover: '🐒', color: theme.green, tracks: 10, artwork: '/assets/album-01.png' },
  { id: 'al18', title: 'Bubble Trouble', artist: 'a12', artistName: 'Paper Arcade', year: 2025, cover: '🦆', color: '#FFE14F', tracks: 7, artwork: '/assets/album-02.png' },
  { id: 'al19', title: 'Wiggle Room', artist: 'a12', artistName: 'Paper Arcade', year: 2024, cover: '🐶', color: '#4FB7FF', tracks: 6, artwork: '/assets/album-03.png' },
  { id: 'al20', title: 'Confetti Engine', artist: 'a13', artistName: 'Velvet Menagerie', year: 2026, cover: '🎊', color: theme.pink, tracks: 12, artwork: '/assets/album-04.png' },
  { id: 'al21', title: 'Driftless', artist: 'a13', artistName: 'Velvet Menagerie', year: 2025, cover: '🎈', color: '#FF9F2E', tracks: 9, artwork: '/assets/album-05.png' },
  { id: 'al22', title: 'Three Gymnopédies', artist: 'a14', artistName: 'Aria Solenne', year: 2026, cover: '🕯️', color: '#B7A8FF', tracks: 3, artwork: '/assets/album-06.png' },
  { id: 'al23', title: 'Thaw', artist: 'a14', artistName: 'Aria Solenne', year: 2025, cover: '🧊', color: '#7CD4FF', tracks: 4, artwork: '/assets/album-07.png' },
];

// Album → real audio file (Kevin MacLeod, CC-BY 4.0). Duration = ffprobe seconds.
const ALBUM_AUDIO: Record<string, { file: string; duration: number }> = {
  al1: { file: 'electrodoodle', duration: 166 },
  al2: { file: 'bittersweet', duration: 202 },
  al3: { file: 'marty-gots-a-plan', duration: 168 },
  al4: { file: 'volatile-reaction', duration: 165 },
  al5: { file: 'frost-waltz', duration: 135 },
  al6: { file: 'deliberate-thought', duration: 177 },
  al7: { file: 'gonna-start', duration: 155 },
  al8: { file: 'cheery-monday', duration: 80 },
  al9: { file: 'off-to-osaka', duration: 110 },
  al10: { file: 'heartbreaking', duration: 96 },
  al11: { file: 'whiskey-on-the-mississippi', duration: 195 },
  al12: { file: 'kool-kats', duration: 201 },
  al13: { file: 'the-builder', duration: 118 },
  al14: { file: 'windswept', duration: 208 },
  al15: { file: 'investigations', duration: 94 },
  al16: { file: 'disco-medusae', duration: 221 },
  al17: { file: 'monkeys-spinning-monkeys', duration: 125 },
  al18: { file: 'fluffing-a-duck', duration: 67 },
  al19: { file: 'quirky-dog', duration: 149 },
  al20: { file: 'hyperfun', duration: 233 },
  al21: { file: 'carefree', duration: 205 },
  al22: { file: 'gymnopedie-no-1', duration: 187 },
  al23: { file: 'ice-flow', duration: 142 },
};

interface RawTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  plays: string;
}

const RAW_TRACKS: RawTrack[] = [
  { id: 't1', title: 'Phantom Signal', artist: 'Nora Veil', artistId: 'a1', album: 'Phantom Frequencies', albumId: 'al1', plays: '12.4M' },
  { id: 't2', title: 'Deep Resonance', artist: 'Nora Veil', artistId: 'a1', album: 'Phantom Frequencies', albumId: 'al1', plays: '8.7M' },
  { id: 't3', title: 'Dissolve', artist: 'Ghost Meridian', artistId: 'a2', album: 'Soft Collapse', albumId: 'al2', plays: '6.2M' },
  { id: 't4', title: 'Paper Walls', artist: 'Ghost Meridian', artistId: 'a2', album: 'Soft Collapse', albumId: 'al2', plays: '4.1M' },
  { id: 't5', title: 'Midnight Silk', artist: 'Sable', artistId: 'a3', album: 'Velvet Hours', albumId: 'al3', plays: '18.9M' },
  { id: 't6', title: 'Golden Skin', artist: 'Sable', artistId: 'a3', album: 'Velvet Hours', albumId: 'al3', plays: '15.3M' },
  { id: 't7', title: 'Circuit Prayer', artist: 'HEXFORM', artistId: 'a4', album: 'Machine Hymns', albumId: 'al4', plays: '3.8M' },
  { id: 't8', title: 'Rust Protocol', artist: 'HEXFORM', artistId: 'a4', album: 'Machine Hymns', albumId: 'al4', plays: '2.9M' },
  { id: 't9', title: 'Stained Light', artist: 'Lumen Choir', artistId: 'a5', album: 'Glass Cathedral', albumId: 'al5', plays: '1.4M' },
  { id: 't10', title: 'Tidal Pull', artist: 'Drift Signals', artistId: 'a6', album: 'Tidal Memory', albumId: 'al6', plays: '2.1M' },
  { id: 't11', title: 'Black Diamond', artist: 'Vanta Black', artistId: 'a7', album: 'Obsidian', albumId: 'al7', plays: '24.6M' },
  { id: 't12', title: 'Crown Heavy', artist: 'Vanta Black', artistId: 'a7', album: 'Obsidian', albumId: 'al7', plays: '19.2M' },
  { id: 't13', title: 'Solar Flare', artist: 'Solaris', artistId: 'a8', album: 'Supernova', albumId: 'al8', plays: '42.1M' },
  { id: 't14', title: 'Gravity Kiss', artist: 'Solaris', artistId: 'a8', album: 'Supernova', albumId: 'al8', plays: '31.8M' },
  { id: 't15', title: 'Neon Haze', artist: 'Nora Veil', artistId: 'a1', album: 'Neon Prayers', albumId: 'al9', plays: '9.3M' },
  { id: 't16', title: 'Echo Chamber', artist: 'Ghost Meridian', artistId: 'a2', album: 'Echoes of Us', albumId: 'al10', plays: '5.6M' },
  { id: 't17', title: 'Afterglow', artist: 'Sable', artistId: 'a3', album: 'Velvet Hours', albumId: 'al3', plays: '11.7M' },
  { id: 't18', title: 'Void Walker', artist: 'HEXFORM', artistId: 'a4', album: 'Machine Hymns', albumId: 'al4', plays: '4.5M' },
  { id: 't19', title: 'Cathedral Rain', artist: 'Lumen Choir', artistId: 'a5', album: 'Glass Cathedral', albumId: 'al5', plays: '980K' },
  { id: 't20', title: 'Deep Current', artist: 'Drift Signals', artistId: 'a6', album: 'Tidal Memory', albumId: 'al6', plays: '1.7M' },
  { id: 't21', title: 'Obsidian Throne', artist: 'Vanta Black', artistId: 'a7', album: 'Obsidian', albumId: 'al7', plays: '16.4M' },
  { id: 't22', title: 'Starborn', artist: 'Solaris', artistId: 'a8', album: 'Supernova', albumId: 'al8', plays: '28.3M' },
  { id: 't23', title: 'Velvet Abyss', artist: 'Sable', artistId: 'a3', album: 'Velvet Hours', albumId: 'al3', plays: '7.8M' },
  { id: 't24', title: 'Static Bloom', artist: 'Nora Veil', artistId: 'a1', album: 'Phantom Frequencies', albumId: 'al1', plays: '6.1M' },
  { id: 't25', title: 'Sunset Spritz', artist: 'Mono Palm', artistId: 'a9', album: 'Sunset Spritz', albumId: 'al11', plays: '3.3M' },
  { id: 't26', title: 'Copacabana Minute', artist: 'Mono Palm', artistId: 'a9', album: 'Sunset Spritz', albumId: 'al11', plays: '2.1M' },
  { id: 't27', title: 'Cool Cats Club', artist: 'Mono Palm', artistId: 'a9', album: 'Cool Cats Club', albumId: 'al12', plays: '1.8M' },
  { id: 't28', title: 'Alley Strut', artist: 'Mono Palm', artistId: 'a9', album: 'Cool Cats Club', albumId: 'al12', plays: '1.2M' },
  { id: 't29', title: 'Timberframe', artist: 'Brine & Cedar', artistId: 'a10', album: 'Timberframe', albumId: 'al13', plays: '940K' },
  { id: 't30', title: 'Peg and Dowel', artist: 'Brine & Cedar', artistId: 'a10', album: 'Timberframe', albumId: 'al13', plays: '720K' },
  { id: 't31', title: 'Gale Songs', artist: 'Brine & Cedar', artistId: 'a10', album: 'Gale Songs', albumId: 'al14', plays: '610K' },
  { id: 't32', title: 'Northwater', artist: 'Brine & Cedar', artistId: 'a10', album: 'Gale Songs', albumId: 'al14', plays: '480K' },
  { id: 't33', title: 'Case Files', artist: 'Casino Vermilion', artistId: 'a11', album: 'Case Files', albumId: 'al15', plays: '2.7M' },
  { id: 't34', title: 'Stakeout at Dawn', artist: 'Casino Vermilion', artistId: 'a11', album: 'Case Files', albumId: 'al15', plays: '1.9M' },
  { id: 't35', title: 'Midnight Baccarat', artist: 'Casino Vermilion', artistId: 'a11', album: 'Midnight Baccarat', albumId: 'al16', plays: '1.4M' },
  { id: 't36', title: 'Velvet Rope', artist: 'Casino Vermilion', artistId: 'a11', album: 'Midnight Baccarat', albumId: 'al16', plays: '980K' },
  { id: 't37', title: 'Jungle Gym Jam', artist: 'Paper Arcade', artistId: 'a12', album: 'Jungle Gym Jam', albumId: 'al17', plays: '5.5M' },
  { id: 't38', title: 'Barrel of Laughs', artist: 'Paper Arcade', artistId: 'a12', album: 'Jungle Gym Jam', albumId: 'al17', plays: '3.6M' },
  { id: 't39', title: 'Bubble Trouble', artist: 'Paper Arcade', artistId: 'a12', album: 'Bubble Trouble', albumId: 'al18', plays: '4.2M' },
  { id: 't40', title: 'Pond Skater', artist: 'Paper Arcade', artistId: 'a12', album: 'Bubble Trouble', albumId: 'al18', plays: '2.8M' },
  { id: 't41', title: 'Wiggle Room', artist: 'Paper Arcade', artistId: 'a12', album: 'Wiggle Room', albumId: 'al19', plays: '2.2M' },
  { id: 't42', title: 'Fetch!', artist: 'Paper Arcade', artistId: 'a12', album: 'Wiggle Room', albumId: 'al19', plays: '1.6M' },
  { id: 't43', title: 'Confetti Engine', artist: 'Velvet Menagerie', artistId: 'a13', album: 'Confetti Engine', albumId: 'al20', plays: '6.8M' },
  { id: 't44', title: 'Sugar Overdrive', artist: 'Velvet Menagerie', artistId: 'a13', album: 'Confetti Engine', albumId: 'al20', plays: '4.9M' },
  { id: 't45', title: 'Driftless', artist: 'Velvet Menagerie', artistId: 'a13', album: 'Driftless', albumId: 'al21', plays: '3.1M' },
  { id: 't46', title: 'Cloud Parade', artist: 'Velvet Menagerie', artistId: 'a13', album: 'Driftless', albumId: 'al21', plays: '2.4M' },
  { id: 't47', title: 'Gymnopédie No. 1', artist: 'Aria Solenne', artistId: 'a14', album: 'Three Gymnopédies', albumId: 'al22', plays: '1.1M' },
  { id: 't48', title: 'Thaw', artist: 'Aria Solenne', artistId: 'a14', album: 'Thaw', albumId: 'al23', plays: '760K' },
];

export const TRACKS: Track[] = RAW_TRACKS.map((t) => {
  const audio = ALBUM_AUDIO[t.albumId];
  return {
    ...t,
    duration: audio.duration,
    audioUrl: `/audio/${audio.file}.mp3`,
  };
});

export const GENRES: Genre[] = [
  { id: 'g1', name: 'Electronic', color: theme.accent, icon: '⚡' },
  { id: 'g2', name: 'Indie', color: theme.pink, icon: '🎸' },
  { id: 'g3', name: 'R&B', color: theme.amber, icon: '🎤' },
  { id: 'g4', name: 'Techno', color: theme.green, icon: '🔊' },
  { id: 'g5', name: 'Classical', color: '#B7A8FF', icon: '🎻' },
  { id: 'g6', name: 'Ambient', color: '#4FB7FF', icon: '🌊' },
  { id: 'g7', name: 'Hip-Hop', color: '#FF6A5C', icon: '🎧' },
  { id: 'g8', name: 'Pop', color: '#FF9F2E', icon: '🌟' },
  { id: 'g9', name: 'Jazz', color: '#9DE85C', icon: '🎷' },
  { id: 'g10', name: 'Metal', color: theme.dim, icon: '🤘' },
];

export const PLAYLISTS_INIT: Playlist[] = [
  { id: 'p1', name: 'Late Night Drive', description: 'Moody beats for empty highways', cover: '🛣️', color: theme.accent, tracks: ['t1', 't5', 't10', 't15', 't3'] },
  { id: 'p2', name: 'Morning Energy', description: 'Wake up and move', cover: '☀️', color: theme.amber, tracks: ['t13', 't11', 't22', 't14', 't6'] },
  { id: 'p3', name: 'Deep Focus', description: 'Zero distractions', cover: '🧠', color: '#4FB7FF', tracks: ['t9', 't10', 't19', 't20', 't2'] },
  { id: 'p4', name: 'Heavy Rotation', description: "Can't stop playing these", cover: '🔄', color: '#FF6A5C', tracks: ['t11', 't13', 't5', 't1', 't7', 't14'] },
];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

export const fmt = (s: number): string => {
  const v = Math.max(0, Math.floor(s));
  const m = Math.floor(v / 60);
  const sec = v % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

# manosli+

Privacy-first music for people who want Spotify’s discovery, Apple Music’s listening polish, and a catalog that stays on their device until they choose otherwise.

**Listen now:** open `v4/app` → `npm install && npm run dev` → `/app`

## Why it exists

Streaming giants optimized for ads, lock-in, and a server that knows every skip. manosli+ is the opposite bet:

- Real audio playback in the browser (CC-BY catalog by Kevin MacLeod)
- On-device library, likes, playlists, history, and analytics
- Spatial simulation via the Web Audio API
- Radio stations and collaborative listening rooms
- Artist studio + public profiles + royalty ledger
- PWA install + Media Session lockscreen controls
- Optional account sync (Vercel API + Mongo) that degrades to localStorage

## Product surface

| Route | What you get |
| --- | --- |
| `/` | Marketing site — product story, spatial, privacy, ecosystem |
| `/app` | Full player: home, search, radio, rooms, library, Your Sound |
| `/studio` | Artist studio, uploads, royalty math |
| `/artist/:id` | Public artist profile, follow, support pledges |
| `/download` | PWA / install path |

## Stack

- Vite + React 19 + TypeScript + React Router
- Tailwind + custom void / pulse / beat / wave / spark tokens
- Web Audio + Media Session + IndexedDB uploads
- Optional serverless API under `v4/app/api/`

## Run locally

```bash
cd v4/app
npm install
npm run dev
```

Build: `npm run build`

## Launch stance

This is a launchable **web product** with a licensed demo catalog. To conquer a market you still need:

1. A licensed or user-uploaded catalog at scale
2. Real-time rooms (WebSocket / WebRTC)
3. Payments for artist pledges
4. Store listings for iOS / Android wrappers

The player, brand, persistence, analytics, and artist loop are already here.

## License

Application code: keep the existing repository terms.
Audio: Kevin MacLeod (incompetech.com), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See `v4/app/public/audio/ledger.json`.

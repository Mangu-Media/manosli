# Verifier v6 — rung 3: catalog expansion + uploads + history
Created: 2026-07-21. Extends v5.
23. Catalog size: public/audio/ contains >= 20 audio files; TRACKS in data layer >= 48.
24. License ledger: a machine-readable ledger exists (public/audio/ledger.json or
    src/pages/player/licenses.ts) mapping every audio file to source URL + license.
25. Uploads: player has an artist-upload flow (grep -ri "upload" src/pages/player) that adds
    user tracks to the catalog client-side (object URL / IndexedDB) and plays them.
26. History hookup: player posts play events to /api/library/history when signed in
    (grep "library/history" src/pages/player).
27. Regression: v2–v5 checks pass; npm run build passes.

# Verifier v4 — stack-agnostic prep (persistence seam + PWA groundwork)
Created: 2026-07-21. Extends v3 (all v2+v3 checks still apply).
12. Repository seam: src/pages/player/ contains a repository/storage abstraction module
    (grep -r "Repository\|storage" src/pages/player) and player state (likes/playlists/history)
    persists to localStorage (grep "localStorage" in player src).
13. PWA manifest: public/manifest.webmanifest (or manifest.json) exists with name containing
    "manosli" and icons entries; index.html links it.
14. Service worker: a service worker file exists (public/sw.js or src registration) AND
    registration code in src (grep "serviceWorker" src/).
15. Media Session API: player sets navigator.mediaSession metadata/ handlers
    (grep "mediaSession" src/pages/player).
16. Regression: v2+v3 checks still pass.

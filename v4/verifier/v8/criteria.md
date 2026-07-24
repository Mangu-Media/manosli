# Verifier v8 — final packages: analytics + search + PWA polish
Created: 2026-07-21. Extends v7.
28. Analytics: player has a listening-analytics view (grep -ri "stats\|analytics\|wrapped\|year in sound"
    src/pages/player) fed from history/recentlyPlayed data (top artists, minutes, plays).
29. Search upgrade: search covers uploads + ranks results (grep -ri "rank\|score\|relevance"
    src/pages/player, or uploads included in searchResults).
30. Install prompt: beforeinstallprompt handling (grep "beforeinstallprompt" src/) with a
    branded install CTA in the player.
31. Media-session polish: seekbackward/seekforward handlers + position state
    (grep "setPositionState\|seekbackward" src/pages/player).
32. Regression: v2–v5, v7 pass; npm run build passes.

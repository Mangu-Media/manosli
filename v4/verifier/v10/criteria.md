# Verifier v10 — Artist public profiles
Created: 2026-07-22. Extends v9.
38. Profile route: App.tsx contains a parameterized artist route (/artist/:id or similar).
39. Profile content: renders artist bio, discography (albums), top tracks from catalog data;
    play actions deep-link or reuse the engine (grep -ri "discography\|top tracks" src/pages).
40. Follow/support: follow button persisted (localStorage or repository) + support/tip stub
    (grep -ri "follow" and "support\|tip" in profile files).
41. Wiring: player artist names link to profiles; Studio links to "view public profile"
    (grep -rq "/artist/" src/pages).
42. Regression: v2–v5, v7–v9 pass; npm run build passes.

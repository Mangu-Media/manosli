# Verifier v9 — Artist Studio
Created: 2026-07-21. Extends v8.
33. Studio route: /studio route exists in App.tsx rendering an artist dashboard.
34. Upload management: studio lists the artist's uploads with edit (title/artist) + delete
    (grep -ri "studio" src/pages/player or src/pages/Studio*).
35. Analytics: studio shows per-track plays/minutes derived from play events + catalog-wide
    mock listener data (grep -ri "plays\|listeners" in studio files).
36. Royalty transparency: a per-track royalty/earnings view computed from plays with an
    explicit rate card + license provenance from ledger.json (grep -ri "royalt\|ledger\|rate" studio files).
37. Regression: v2–v5, v7, v8 pass; npm run build passes.

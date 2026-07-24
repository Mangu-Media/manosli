# Verifier v5 — rung 2: backend + auth + persistence (default stack)
Created: 2026-07-21. Defaults applied (reversible): Vercel serverless API + MongoDB-shaped
data layer + email/OAuth dual auth, frontend falls back to local provider when API absent.
17. Serverless API: api/ directory with auth + library endpoints (ls api/*.ts or api/**/*.ts >= 3).
18. Mongo data layer: grep -r "mongodb" api/ hits (driver import); connection reads env var.
19. ApiRepository real: src/pages/player/repository.ts ApiRepository no longer a bare stub
    (grep for "fetch(" in repository or an api client module); fallback to local when API down.
20. Auth UI: player has sign-in flow (grep -ri "sign in\|login" src/pages/player or PlayerApp)
    incl. email form and Google/Apple OAuth buttons.
21. vercel.json exists with SPA rewrite.
22. Regression: v2–v4 checks pass; npm run build passes.

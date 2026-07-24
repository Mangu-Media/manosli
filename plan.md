# Plan — manosli+ Music Platform Web Experience

Goal slice: Build a rich, content-dense React web app embodying the manosli+ vision
(privacy-first, on-device ML, federated learning, decentralized catalog, spatial audio,
collaborative listening) — the flagship web experience + product showcase.

Skill: vibecoding-webapp-swarm (Mode A, frontend-only with realistic mock data).

## Stage 1 — Init (main agent)
- Run init-webapp.sh → $HOME/init + shared repo /mnt/agents/output/app
- Frontend-only decision (no real auth/db needed for showcase).

## Stage 2 — Design (Pro_Designer subagent)
- design.md + per-page designs in /mnt/agents/output/design/
- Pages expected: Home, Product/Features, Technology (on-device ML, federated learning,
  Rust/Wasm backend), Privacy & Security, Social/Collaborative listening, Spatial/AR,
  Ecosystem & Integrations, Pricing/Download.

## Stage 3 — Scaffold (subagent)
- setup-local.sh scaffold; landing page + Navbar/Footer/Layout; media assets.

## Stage 4 — Parallel page agents (3-5 subagents)
- Each owns page groups per design.md.

## Stage 5 — Merge, build, version (main agent)
- Octopus merge → final-build worktree → npm run build → build_version (static).

## Verifier
- verifier/ folder with acceptance criteria + run log; final check before delivery.

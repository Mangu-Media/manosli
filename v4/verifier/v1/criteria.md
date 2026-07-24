# Verifier v1 — manosli+ web app acceptance criteria
Created: 2026-07-21

1. Build gate: `npm run build` exits 0 in final worktree.
2. Route coverage: App.tsx contains routes for all pages listed in design.md (>=6 distinct routes).
3. Content coverage (grep over src/): pages reference the six spec pillars —
   federated learning, on-device ML / on-device, IPFS / decentralized, end-to-end encryption / E2EE,
   spatial / AR, collaborative / co-curation / shared listening.
4. Branding: "manosli+" appears in index.html title and Navbar/Footer.
5. Shared infra: src/components/Navbar.tsx, Footer.tsx, Layout.tsx exist.
6. Assets: public/ contains >=3 generated media files referenced from src.

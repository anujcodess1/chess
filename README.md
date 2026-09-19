# Grand Chess

A 3D chess web app that runs entirely in your browser. No database, no server, no accounts to
configure — everything (your profile, ratings, game history) is stored locally in your browser
via `localStorage`.

## Features

- **3D chess board** — mouse-drag to orbit, scroll wheel to zoom, reset-camera button
- **Play vs AI** — three difficulties (novice / intermediate / advanced)
- **Local multiplayer** — open a second browser tab and match with Quick Match or a room code
  (tabs on the same machine pair automatically, no server involved)
- **Puzzles** — curated daily tactics puzzles with solve tracking
- **Leaderboard & profile** — built from your locally registered accounts

## Requirements

| Tool  | Version |
| ----- | ------- |
| Node  | >= 20   |
| pnpm  | >= 9    |

```bash
npm install -g pnpm   # if you don't have pnpm yet
```

## Quick start

```bash
# 1. install dependencies
pnpm install

# 2. start the dev server (http://localhost:5175)
pnpm dev
```

Open http://localhost:5175, create an account on the sign-up page, and start playing.

## Other commands

```bash
pnpm build       # production build -> apps/admin/dist
pnpm preview     # serve the production build locally
pnpm typecheck   # TypeScript check for every package
```

## Project structure

```
chess/
├── apps/
│   └── admin/          # the web app (React + Vite + Three.js)
│       ├── src/
│       │   ├── api/        # browser-only store + local matchmaking
│       │   ├── components/ # UI + 3D board
│       │   └── pages/      # auth, home, play, puzzles, leaderboard, profile
│       └── vite.config.ts
├── packages/
│   ├── types/          # shared TypeScript types
│   └── config/         # shared tsconfig bases
└── package.json        # workspace scripts (dev / build / typecheck)
```

## Notes

- Multiplayer pairs **browser tabs of the same machine** (via `BroadcastChannel` +
  `localStorage`). It works offline; there is no internet component.
- To reset all local data (accounts, history, sessions), clear this site's `localStorage` in
  your browser dev tools.

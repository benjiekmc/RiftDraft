# RiftDraft — Wild Rift Draft Assistant

A pre-game ban and pick decision-support tool for *League of Legends: Wild Rift* ranked draft.

## Features

- **Draft Board & Ban/Pick Recommendations**: Track allied/enemy picks and bans, and get ranked ban and lane-pick suggestions scored from live patch metrics, team composition fit, and your personal champion pool.
- **Team Composition Signals**: Real-time analysis of physical/magic damage balance, frontline coverage, engage, and crowd control.
- **Personal Champion Pool & Scoring Weights**: Rate champions `1–5` by lane, mark **Main** (priority boost) or **Avoid** (hidden unless top meta), and tune pick/ban scoring weights.
- **Sync Code & Backup**: Save and restore your rank, role, champion pool, and weights across devices using a portable `RD1-` sync code, recovery link, or JSON export/import—no account required.
- **Live Champion Statistics**: View ranked win rate, pick rate, and ban rate by tier (`Diamond+`, `Master+`, `Challenger`, `Legendary`) and lane, with an offline demo dataset option.
- **Bilingual UI (`EN` / `繁中`)**: One-click toggle between English and Traditional Chinese for the full interface and all 143 champions.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Useful Scripts

- `npm run dev` — Start the Express + Vite development server on port `3000`
- `npm run build` — Build the production bundle into `dist/`
- `npm start` — Serve the production build via `server.ts`
- `npm run lint` — Run TypeScript type checking (`tsc --noEmit`)

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Dev Server**: Express, Vite

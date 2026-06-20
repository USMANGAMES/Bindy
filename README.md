# bindy.

Mobile-first PWA for an eco-startup that maps recycling bins, lets users snap photos for AI recognition, and rewards them with eco points.

Built with a premium fintech-style UI — clean layout, mint green accents, soft shadows, and smooth animations.

## Features

- **Interactive map** — Leaflet map with geolocation, custom bin markers, and a nearby-bins summary
- **Bin details** — Tap a marker to see fill level, distance, verification status, and directions
- **Photo capture flow** — Camera FAB → preview → AI processing → success or error
- **Leaderboard** — Weekly rankings with podium for top contributors
- **Profile** — Eco points, streak, bins reported, and recent submission history
- **PWA** — Installable, offline-ready via service worker, safe-area support for mobile
- **Persistent state** — Profile, points, and submissions saved in `localStorage`

## Tech stack

| Layer | Tools |
|-------|-------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Map | Leaflet, react-leaflet, Carto Voyager tiles |
| Animation | Framer Motion |
| Icons | Lucide React |
| Build | Vite 8 |
| PWA | vite-plugin-pwa |

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone <repo-url>
cd Bindy
npm install
```

### Development

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

For mobile testing, expose the dev server on your network:

```bash
npm run dev -- --host
```

### Production build

```bash
npm run build
npm run preview
```

The output is in `dist/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── App.tsx                 # App root + provider
├── components/
│   ├── BindyApp.tsx        # Main shell, tabs, capture orchestration
│   ├── capture/            # Camera FAB and flow modals
│   ├── layout/             # Bottom navigation
│   ├── map/                # Map, header, bin detail sheet
│   ├── screens/            # Map, Leaderboard, Profile
│   └── splash/             # Onboarding screen
├── context/
│   └── AppContext.tsx      # Global state + persistence
├── data/
│   ├── bins.ts             # Seed bin locations (Tashkent demo)
│   └── leaderboard.ts      # Leaderboard seed data
├── hooks/
│   ├── useCaptureFlow.ts   # Photo capture state machine
│   └── useGeolocation.ts   # Browser geolocation
├── services/
│   ├── aiService.ts        # Mock AI bin recognition
│   └── storage.ts          # localStorage helpers
└── types/
    └── index.ts            # Shared TypeScript types
```

## User flow

1. **Splash** — First visit shows onboarding; skipped on return visits
2. **Map** — Explore bins, use the locate button, tap markers for details
3. **Capture** — Tap the camera FAB, take or select a photo, then send to Bindy
4. **AI analysis** — Mock service analyzes the image (~2.5s)
5. **Result** — Success adds eco points and updates the global bin counter; error prompts retry
6. **Rank / Profile** — View standings and personal stats

## Design tokens

| Token | Value |
|-------|-------|
| Primary (mint) | `#10B981` |
| Background | `#F9FAFB` |
| Text | `#1F2937` |
| Accent (yellow) | `#F59E0B` |

Typography: [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts.

## PWA installation

In Chrome or Edge on desktop or Android:

1. Run the production build (`npm run build && npm run preview`) or deploy `dist/`
2. Use **Install app** from the browser menu, or accept the in-app install prompt

On iOS Safari, use **Add to Home Screen** from the share menu.

## Configuration notes

- **Map tiles** — Carto Voyager (no API key required)
- **Default map center** — Tashkent (`41.2995, 69.2401`) when geolocation is denied
- **Demo bins** — Edit `src/data/bins.ts` to change locations
- **AI service** — Replace `src/services/aiService.ts` with a real API when ready
- **Reset app state** — Run `localStorage.clear()` in the browser console and refresh

## License

Private project — all rights reserved.

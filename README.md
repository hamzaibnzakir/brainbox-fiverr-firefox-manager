# Brainbox Firefox Manager

A control-center UI for managing isolated Firefox identities — each with its
own proxy, credentials, startup behavior, and target website. This is the
frontend only (React + TypeScript + Tailwind CSS), built on mock data and
ready to wire up to a Python backend.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS (custom dark "graphite + electric violet" theme, see
  `tailwind.config.ts`)
- Radix UI primitives (Dialog, Dropdown Menu, Switch, Tooltip, Slider) —
  the same primitives shadcn/ui is built on, hand-wired here as local
  components in `src/components/ui/`
- lucide-react for icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static
production bundle in `dist/`.

## Project structure

```
src/
  components/
    layout/       Sidebar, TopBar, BottomBar
    ui/           Primitives: Button, Badge, Input, Select, Switch,
                   Slider, Dialog, Drawer, DropdownMenu, Tooltip, SearchField
    dashboard/    Dashboard + stat widgets
    profiles/     Profile list, row, edit drawer, add-profile stepper modal
    proxy/        Proxy Manager table
    activity/     Activity timeline
    settings/     Settings sections
  data/mock.ts    Mock profiles, discovered Firefox profiles, activity feed
  types.ts        Shared TypeScript interfaces
  lib/            cn() class helper, flag emoji helper
```

## Wiring up a backend

Every screen currently reads from `src/data/mock.ts` and mutates local
React state. To connect a real backend:

1. Replace the imports from `@/data/mock` with API calls (e.g. a small
   `src/lib/api.ts` that fetches `/api/profiles`, `/api/proxies`, etc.).
2. The `FirefoxProfile` type in `src/types.ts` is the contract — keep your
   backend's JSON shape aligned with it (or add a mapping layer).
3. Actions that currently just update local state (`Launch`, `Stop`,
   `Test proxy`, `Test all proxies`, `Add Profile`, `Save changes`) are the
   points where you'll add real POST/PUT requests to your Python service —
   each is already isolated in its own handler function inside the
   relevant page component.
4. `discoveredFirefoxProfiles` in mock data stands in for whatever endpoint
   enumerates the Firefox profiles already installed on the machine.

## Design notes

Dark-only, graphite background (`#0A0A0D`) with a single electric-violet
accent (`#7C5CFF`) reserved for primary actions, active nav state, and
focus rings. Profile rows are edge-to-edge (Linear-style), not cards.
Full token list lives in `tailwind.config.ts` under `theme.extend.colors`.

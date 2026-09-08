# Brainbox Firefox Manager — Integration Build

This build converts the design export from a static mock UI into a live-data frontend.

## What is already wired

- Central live application state in `src/context/AppData.tsx`
- Local backend client in `src/lib/api.ts`
- Automatic polling every 2.5 seconds
- Engine online/offline state on Dashboard
- Real profile list source from backend snapshot
- Start All / Restart All / Stop All actions
- Launch / Stop / Duplicate / Delete profile actions
- Add Profile and Edit Profile persistence actions
- Test one proxy / Test all proxies actions
- Activity page reads backend events
- Settings page loads and saves backend settings
- Firefox profile discovery is backend-driven
- Safe offline fallback contains the six known Brainbox profile/proxy mappings but no proxy passwords

## Backend address

Default: `http://127.0.0.1:8765/api`

Override at build/runtime using:

`VITE_BRAINBOX_API_URL=http://127.0.0.1:8765/api`

## API expected by the frontend

- `GET /api/snapshot`
- `POST /api/start-all`
- `POST /api/restart-all`
- `POST /api/stop-all`
- `POST /api/profiles/:id/launch`
- `POST /api/profiles/:id/stop`
- `POST /api/profiles`
- `PUT /api/profiles/:id`
- `DELETE /api/profiles/:id`
- `POST /api/profiles/:id/duplicate`
- `POST /api/profiles/:id/test-proxy`
- `POST /api/proxies/test-all`
- `PUT /api/settings`

Every successful mutating endpoint returns the same full snapshot shape as `GET /api/snapshot`.

## Important

The React side is now ready for the real Python engine. The last connection step requires the exact current `manager.py` and `config.json` from `~/brainbox-browser-manager` so the HTTP adapter can call the proven browser/proxy code instead of recreating it and risking regressions.

# House Matters — Next.js frontend

This folder is now a Next.js App Router application using React and TypeScript. The existing Express backend remains separate and unchanged.

## Run locally (PowerShell)

Requires Node.js 20.9 or newer (Node.js 24 LTS recommended).

```powershell
Set-Location 'C:\Users\hp\House Matters\frontend'
npm install
npm run dev
```

Open http://localhost:5173. Production: `npm run build`, then `npm start`.

Requests to `/api/*` are rewritten to `http://localhost:3000/api/*`. To change this, copy `C:\Users\hp\House Matters\frontend\.env.example` to `C:\Users\hp\House Matters\frontend\.env.local` and set the server-only `API_URL`. Set this variable **before building** for production, and rebuild when it changes. Do not point it at the Next.js frontend itself.

The Express API retains port 3000. Its `FRONTEND_URL` should match the frontend origin (default http://localhost:5173). Next.js needs a server deployment; static export cannot provide this proxy.

## What was migrated

- Landing page, navigation, hero, property cards, informational sections and footer.
- Original styles, including the stylesheet previously injected by the old JavaScript.
- React-based login/registration dialogs, property details, mobile menu, image fallbacks and notifications.
- Ten Nigerian sample homes across Lagos, Abuja, Ibadan, Port Harcourt, Enugu and Kano, with annual naira rent filters, city tabs, sorting and reset.
- Green-and-cream responsive design, locally stored illustrative photos, and Nigerian renter guidance. Images and source notes are in `C:\Users\hp\House Matters\frontend\public\images`.
- Original static HTML, Vite configuration and JavaScript archived under `C:\Users\hp\House Matters\frontend\legacy`. These are not routes served by Next.js.

## Important limitations

This is a frontend conversion, not completion of the rental platform. Listings remain explicitly labeled demo inventory. Messaging, bookings, listing submission and many footer destinations were incomplete in the original frontend and are not implemented here. Fonts use Google Fonts with system fallbacks; property photos are served locally and are illustrative stock images, not photos of the named Nigerian sample listings.

Login and registration forms send requests through `/api/auth/*`, but live authentication is **not verified**: the unchanged `C:\Users\hp\House Matters\backend\server.js` has an existing syntax error at line 133. Registration also has an existing contract mismatch: its validator expects `firstName`, `lastName`, `role`, while the route reads `name`, `userType`. The frontend follows the validator fields. These backend issues need a separate repair before live account flows can work. Login token persistence is retained in localStorage; this migration does not implement session refresh or authenticated dashboards.

## Validation

```powershell
Set-Location 'C:\Users\hp\House Matters\frontend'
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

To use an installed Edge browser instead of downloaded Chromium:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm test
```

Tests start and stop the production frontend automatically; keep ports 5173 and 3000 free. The proxy test temporarily uses port 3000 for an isolated test API and expects the default `API_URL`. It does not test the real Express backend. External image/font requests are blocked in browser tests for repeatability. A JSON report is written to `C:\Users\hp\House Matters\frontend\test-results\report.json`.

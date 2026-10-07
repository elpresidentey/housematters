# Deploying House Matters

Two Vercel projects, deployed from the same GitHub repo:

| Project | Root directory | What it serves |
| --- | --- | --- |
| `frontend` | `frontend` | Next.js 16 site |
| `backend` | `backend` | Express API on Supabase Postgres |

Each has its own `vercel.json`. The frontend proxies `/api/*` and `/uploads/*` to
the backend, so the browser only ever talks to the frontend origin and CORS stays
out of the way.

## One-time setup

1. Create a `backend` Vercel project with the Root Directory set to `backend`.
2. Create a Supabase project and run the schema against it:

   ```bash
   cd backend
   npm run migrate   # creates the tables in 001_supabase.sql
   ```

3. Create a Storage bucket named `property-images` in Supabase and make it public.
   Property photos are served from its public URL.

## Environment variables

### `backend` project

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres. Use the **transaction pooler** (port 6543) for serverless. |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only. Required for image uploads. |
| `SUPABASE_STORAGE_BUCKET` | Defaults to `property-images`. |
| `JWT_SECRET` | Any long random string. Must match nothing else; it signs every session token. |
| `FRONTEND_URL` | Comma-separated allowed origins, e.g. `https://your-app.vercel.app,https://your-other-app.vercel.app` |

Leaving `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` unset falls back to local
disk, which is what you want for `npm run dev` and useless on Vercel.

### `frontend` project

| Variable | Notes |
| --- | --- |
| `API_URL` | Origin of the deployed backend, e.g. `https://backend.vercel.app`. **Required** in production. |

`API_URL` is read at build time, so it must be set on the project, not just in
preview builds. When it is missing the build logs a warning and `/api/*` is not
rewritten, which is why the site falls back to its bundled sample listings.

Add environment variables with `vercel env add <NAME> production` from the
relevant directory, or in Project Settings → Environment Variables.

## Deploying

Push to `main` and both projects rebuild:

```bash
git push origin main
```

Deploy the backend first, confirm `https://<backend-domain>/health` returns
`{"status":"OK", ...}` with `database.connected: true`, then set `API_URL` on the
frontend to that domain and redeploy it.

## Local development

The frontend reads `API_URL` from `frontend/.env.local`; the backend from
`backend/.env`. Copy both `.env.example` files as a starting point. The backend
listens on 3001, which is what the frontend defaults to.

```bash
cd backend && npm run dev    # http://localhost:3001
cd frontend && npm run dev   # http://localhost:5173
```

## Notes and limits

- The rate limiter counts per serverless instance, so it is approximate. Put a
  real rate limit in front of the API for anything stricter.
- `npm run seed` truncates all data. `supabase-setup.js` is the safer path: it
  creates the schema if absent and skips seeding when properties already exist.
# OneTRIP web app

The real product: Next.js 16 (App Router, TypeScript, Tailwind 4) as a PWA, backed by Supabase (Postgres + Auth + Storage + Realtime). English and Traditional Chinese. See `../docs/BUILD_PLAN.md` for scope and milestones.

## Run locally

Requires Node 20+ and Docker Desktop (for the local Supabase stack).

```bash
npm install
npx supabase start          # first run pulls images; prints the API URL, anon key and service role key
cp .env.example .env.local  # paste the printed values
npx supabase db reset       # applies supabase/migrations and supabase/seed.sql (the Sydney family trip)
npm run dev                 # http://localhost:3000
```

Sign in on `/signin` with the demo buttons (Jennie, John, Mary, Tom), or with a magic link. Local magic-link emails land in Mailpit at http://127.0.0.1:54324.

## Use Supabase cloud instead

Create a project at supabase.com, then:

```bash
npx supabase link --project-ref <ref>
npx supabase db push        # migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # optional demo data
```

Put the project URL and anon key in `.env.local` (and in Vercel's environment for deploys).

## Checks

```bash
npm run typecheck
npm test
npm run lint
```

## Layout

- `src/app` routes. Trip screens live under `src/app/t/[tripId]/…`; each folder's `actions.ts` holds its server actions (validated with zod, run under row-level security).
- `src/lib/money` pure money engine (splits, balances, settlement, currency) with tests.
- `src/lib/trip` trip loader and derived views (today, forecast, health).
- `src/lib/brain` Trip Brain answers computed from trip data.
- `src/lib/i18n` dictionaries and hooks.
- `supabase/migrations` schema and policies; `supabase/seed.sql` demo trip.

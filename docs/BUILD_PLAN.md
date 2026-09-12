# OneTRIP build plan

One trip. Everyone together. This document is the source of truth for the real product build. The clickable prototype at the repo root stays as the design reference and demo.

## Decisions (12 Sep 2026)

| Area | Choice | Why |
|---|---|---|
| Platform | Next.js 15 (App Router, TypeScript) as a PWA in `web/` | One codebase, installable on phones, fast deploys, reuses prototype concepts |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) | Free tier, row-level security per trip, realtime keeps the group in sync |
| Languages | English + Traditional Chinese from day one | Matches the family's bilingual day sheet |
| Design | Playful illustrated style evolved from the Postcard look | Teal + sunshine yellow, big pill buttons, illustrated hero scenes, mascot |
| Hosting | Vercel for the app, Supabase cloud for data | Zero-ops for a small team |

## Architecture

```
web/
  src/app/            routes (App Router), one folder per screen
  src/components/     UI kit (buttons, cards, sheets, nav) + feature components
  src/lib/supabase/   client + server helpers, typed queries
  src/lib/money/      currency, split, balances, settlement (pure functions, unit tested)
  src/lib/i18n/       dictionaries (en, zh-Hant) + useT() hook
  src/lib/brain/      Trip Brain: deterministic answers over trip data, LLM optional later
  supabase/           migrations, seed (the Sydney trip), RLS policies
```

Principles
- Every table has `trip_id`. Row-level security allows access only to members of that trip.
- Money is stored in the trip's base currency in minor units (cents) as integers. Reporting currency is a view-time conversion with a stored rate snapshot per expense.
- Realtime subscriptions on itinerary, decisions, expenses so everyone sees the same trip.
- Server actions for writes; all input validated with zod; no secrets in the client.
- Offline-tolerant reads via the PWA cache; writes require a connection in v1.

## Data model (P0)

trips, trip_members (role: owner|admin|traveller|viewer), places, itinerary_items, bookings,
decisions, decision_options, votes, expenses, expense_shares, receipts, receipt_items,
settlements, documents, notifications, activity_log, notes.

## Scope

P0 (first usable release)
1. Sign in (magic link), create trip, invite by link/code, join
2. Trip Home + Today
3. Itinerary (timeline + calendar), add/edit/move items, photos per stop
4. Decisions: options, votes, confirm → itinerary
5. Money: expenses, splits (equal, amounts, %, shares), balances, settle up
6. Receipt capture: photo upload + manual itemisation (OCR later)
7. Multi-currency with reporting currency
8. Trip Brain over real data (deterministic first)

P1: map, Trip Inbox with document parsing, Trip Health, notifications, Travel Mode
P2: documents library, activity history, memories

## Milestones

1. Scaffold, design tokens, i18n, Supabase schema + seed — app runs locally with the Sydney trip
2. Auth + trips + members + invite
3. Itinerary
4. Decisions
5. Money
6. Receipts + currency
7. Trip Brain, PWA install, deploy to Vercel

## Security (VibeSec checklist applied)

- RLS on every table; membership checked in policies, never in the client
- Roles enforced server-side for itinerary/expense/booking writes
- Storage buckets private; signed URLs for receipts and documents
- Invite codes are random, expire, and can be rotated by the owner
- No PII in URLs; magic-link auth; CSRF-safe server actions; security headers set in `next.config`

# OneTRIP ✨ AI helper — agreed plan (22 Nov 2026)

Two jobs, built together, sharing one place-checking and one limits layer.

## Decisions (from the interview)
| Topic | Decision |
|---|---|
| Scope | Trip planner **and** quick add, in one release |
| Place details | OpenStreetMap now; code shaped so Google Places can be switched on later |
| Planner style | Guided steps with chips + one free-text box (not an open chat) |
| Status of AI items | 提議 (proposed) — family votes/confirms |
| Quick-add input | Speak (phone speech-to-text: Cantonese / Mandarin / English) or type |
| Places per day | Follows trip style: relaxed ≈ 3, balanced ≈ 4–5, busy ≈ 6 |
| Cost limit | Per trip per day: 3 plans + 50 quick adds |
| Budget | Rough cost per place (per group), editable, feeds Money/budget |

## A. Trip planner — "✨ 用 AI 幫你諗" on the new-trip page
1. **Where & when** — destination, start/end dates (nights shown), who's going (adults/kids).
2. **What you love** — chips: 🛍 shopping · 🍜 food · ☕ coffee · 🏯 sightseeing · 🌳 nature · 👶 kids · 🎨 culture · 🌃 nightlife; plus trip style (relaxed / balanced / busy).
3. **Where you stay / like** — preferred area(s) (e.g. Shinjuku), optional hotel, one free-text box ("no early mornings", "grandma walks slowly").
4. **Draft** — day-by-day cards grouped by area: photo, name (EN + 中文), area, suggested time, rough cost, one-line why. Each card: ✓ keep · ✕ remove · ⟳ swap (asks AI for an alternative nearby). Places the map can't find are flagged "未搵到地址" and unticked.
5. **Create trip** — trip + kept places as activities (status 提議, ✨ marked), places pinned on the map, estimated costs filled in.

## B. Quick add — "✨ 講/打字加活動" in the + menu (and on the plan page)
1. 🎤 speak or type, e.g. "6號下午3點 Blue Bottle 清澄白河".
2. AI reads name, date/day, start/end time; place is looked up near the trip destination.
3. Preview card: name, day & time, address + map pin, ✨ note (e.g. closing time, tips), rough cost. Every field editable.
4. Add → activity saved as 提議 with the place pinned. If the place matches one already in the trip, it is reused.

## Shared engineering
- Claude via the server only (`ANTHROPIC_API_KEY`, already set in Vercel); structured output (zod schema) like `/api/receipt/read`.
- Every AI place passes a **place check** (`lib/places/*`): OpenStreetMap search near the destination → lat/lng, address, area. Interface ready for a Google Places provider later.
- **Limits:** new table `ai_usage (trip_id, day, kind, count)`; server checks before each AI call. Needs one SQL file run by hand in the Supabase SQL Editor (also appended to `deploy.sql`).
- Bilingual: AI returns `title` + `title_zh`, `note` + `note_zh` (matches existing columns).
- Only travellers/owners/admins can use AI; prompts never include personal data beyond trip places/dates.

## Not in v1
Open chat; bookings/tickets; Google Places; offline queue for quick add.

## v2 — one ✨ add screen with photo (interview 22 Nov 2026)
| Topic | Decision |
|---|---|
| Camera access | Big 📷 button on **今日** and **行程** on every trip day, plus 相片 in the + menu |
| AI on photos | Yes: photo + GPS + time (+ words) → name, type, note, rough cost; counts toward 50 quick adds/trip/day |
| Screens | **One** ✨ add screen: photo optional, speak/type optional, one suggested card to check and save |
| Planned match | Ask "Are you at …?" — one tap adds the photo to that activity, or add as a new stop |

Flow: tap 📷 (camera opens) or ✨ (screen opens) → optional photo + optional words → AI card (name, day/time, address + pin, note, cost) → 加入行程.
Status rule: something happening now (photo just taken / time ≈ now) → 完成; a future stop → 提議.

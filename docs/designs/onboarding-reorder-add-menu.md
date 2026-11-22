# OneTRIP — onboarding, reorder and the + menu (CEO review, 22 Nov 2026)

Mode: SELECTIVE (hold the user's scope, cut duplicates). All decisions below came from the interview (D1–D11).

## Decisions
| # | Topic | Decision |
|---|---|---|
| D1 | Reorder activities | Drag in a **排序** mode with a handle; a box confirms the new time before saving |
| D2 | Knock-on | Ask each time: "Also move the N activities after it by +X?" (Yes / Only this one) |
| D3 | Download | Home-screen web app (PWA) with a guided "Add to home screen" tip |
| D4 | Sign in | **6-digit email code** typed on the same screen + a real email sender (Brevo); password tab kept |
| D6 | Editing | Everyone who joins can edit (unchanged); history + notifications show changes |
| D7 | First screen | One-screen welcome: ✨ 用 AI 幫你諗行程 / 自己建立行程 / 我有邀請代碼 + home-screen tip |
| D8 | Save a place | Working **📍 收藏地點**: search a place, save as ⭐ on the map, no time |
| D9 | Voice | Removed from + menu; **🎤 講出使費** on the expense page fills amount, currency, payer, split |
| D10 | Notes | **備註** page under 更多 (list, edit, delete, pin); pinned notes shown on 今日 |
| D11 | + menu | 3 big: ✨ 新增活動 · 📷 影相 · 💰 記使費. Small: 📄 預訂及文件 · 🗳 投票決定 · 📝 備註 · 📍 收藏地點. Plan page: one **+ 活動** (opens ✨) |

## New-user journey (target)
```
 WhatsApp invite link / onetrip-app.vercel.app
        │
        ▼
 Join preview (trip card) ──or── Sign-in page
        │                          │ email → 6-digit code (same screen) / password
        ▼                          ▼
 Signed in ──(new user, no trips)──▶ Welcome: ✨ AI plan | 自己建立 | 我有代碼  (+ Add to home screen tip)
        │ (came from invite)                    │
        ▼                                       ▼
 Joined trip as traveller (can edit) ◀── Create trip ──▶ Invite page: WhatsApp / SMS / email / copy
        │
        ▼
 Trip: 今日 · 行程 (排序 drag) · 地圖 · 錢 · 更多 (備註, 旅伴, 相簿…) · + menu (6 jobs)
```

## + menu (target)
```
┌ 新增 ──────────────────────────────────┐
│ ✨ 新增活動  講、打字或者影相，AI 幫你填  │  (inside: "自己填" manual form)
│ 📷 影相 (相簿・收據)   💰 記使費 (手入・掃收據・🎤) │
│ 📄 預訂及文件  🗳 投票決定  📝 備註  📍 收藏地點 │
└────────────────────────────────────────┘
Removed: 地點→map (misleading), 語音 (broken), 收據 tile (inside 📷/💰), 預訂+文件 merged, separate 活動 tile.
```

## Reorder (排序) flow
```
 行程 day → tap 排序 → cards show ≡ handles
   drag card ─▶ drop between A (ends 12:00) and B (starts 14:00)
        ▼
 proposed start = A.end (or A.start+60) ; keep duration ; clamp 00:00–23:59
        ▼
 Confirm box: "時間由 3:37 改做 12:00" [確定] [取消]
        ▼ (if later items now overlap)
 "後面 2 個活動都推遲 +45 分鐘？" [一齊推遲] [只改呢個]
        ▼
 save (one server action, all changed items in one update) ─▶ activity log + notification
   failure → card snaps back, "改唔到，再試" message
```

## Error and failure handling (must ship with the feature)
| Codepath | Failure | Handling / what the user sees |
|---|---|---|
| Reorder save | network / permission / item deleted by someone else | revert order, message 改唔到，再試; reload the day |
| Reorder | dropped on same spot, or day with 1 item | no-op, no dialog |
| Reorder | times cross midnight after shifting | clamp to 23:59 and warn in the confirm box |
| Email code | wrong / expired code, too many tries | clear message, "再寄一次" after 60 s cooldown |
| Email sender | Brevo not configured / sending fails | show error with password-tab fallback; never a silent wait |
| Welcome | user already has trips | skip welcome, go to My trips |
| Add to home screen | iPhone (no install prompt) | show 2-step Share → 加至主畫面 picture tip; Android uses the native prompt; dismiss is remembered |
| 收藏地點 | place not found on the map | save with name only, ⚠️ no pin |
| 講出使費 | speech unsupported / AI unsure | type box fallback; fields stay editable, nothing saved without confirm |
| Notes | edit conflict (two people) | last save wins, history records both |

## Needs from you
- Create a free **Brevo** account and an SMTP key (I'll give the exact clicks), then the key goes into Supabase Auth → SMTP settings. Until then the code emails keep the 2/hour limit.

## Implementation tasks
- [ ] **T1 (P1, CC ~40 min)** — 行程 — 排序 mode: drag handles, time proposal, confirm, knock-on question, single save action, revert on failure
- [ ] **T2 (P1, CC ~30 min)** — + menu — 3 big + 4 small layout; plan page single + 活動; remove old tiles
- [ ] **T3 (P1, CC ~20 min)** — 📍 收藏地點 sheet: search (OpenStreetMap), save ⭐ place, show on map
- [ ] **T4 (P1, CC ~30 min)** — 💰 🎤 講出使費 on the expense page (AI fills; user confirms)
- [ ] **T5 (P1, CC ~25 min)** — 備註 page (list / edit / delete / pin) + pinned on 今日
- [ ] **T6 (P1, CC ~25 min + your Brevo setup)** — sign-in with 6-digit email code; keep password tab; error states
- [ ] **T7 (P2, CC ~20 min)** — welcome screen for new users with no trips
- [ ] **T8 (P2, CC ~20 min)** — PWA: manifest check, Android install prompt, iPhone 2-step tip, remember dismiss
- [ ] **T9 (P2)** — labels in EN + 繁中 for all new text; test each flow on a phone

## NOT in scope
App Store / Google Play apps (later project) · Google/Apple sign-in · view-only invite links · per-day notes · offline editing.

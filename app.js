/* OneTRIP prototype — router, components, screens, flows.
   Every screen reads from the shared S model in data.js and writes back to it. */

/* ---------- Tiny helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (vals[i] == null ? '' : vals[i]), '');
const av = (pid, cls) => { const p = P(pid); return p ? `<span class="avatar ${cls || ''}" style="background:${p.color}" title="${p.name}">${p.initials}</span>` : ''; };
const avs = (ids, max) => { max = max || 5; const shown = ids.slice(0, max); return `<span class="avatars">${shown.map(i => av(i)).join('')}${ids.length > max ? `<span class="avatar more">+${ids.length - max}</span>` : ''}</span>`; };
const names = ids => ids.map(i => P(i).name).join(', ');
const me = () => P(S.me);
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const dual = jpy => `<span class="money">${fmtJpy(jpy)}</span> <span class="tiny">≈ ${fmtHome(jpy)}</span>`;
const FOOD_EMOJI = { Food: '🍽️', Accommodation: '🏨', Activities: '🎟️', Transport: '🚕', Shopping: '🛍️', Other: '📦' };
const CAT_COLORS = { Accommodation: '#0F766E', Food: '#E8541E', Activities: '#6D28D9', Transport: '#2457C5', Shopping: '#BE185D', Other: '#8A949C' };

/* ---------- Router ---------- */
let route = { name: 'welcome', p: {} };
const history_ = [];
function go(name, p, opts) {
  if (!opts || !opts.replace) history_.push(route);
  route = { name, p: p || {} };
  closeSheet(true);
  render();
  $('#main').scrollTop = 0;
}
function back() { const r = history_.pop(); if (r) { route = r; closeSheet(true); render(); } else go('home'); }
const NAV = [
  { id: 'today', label: 'Today', ic: '☀️' }, { id: 'plan', label: 'Plan', ic: '🗓️' }, { id: 'map', label: 'Map', ic: '🗺️' }, { id: 'money', label: 'Money', ic: '💴' }, { id: 'more', label: 'More', ic: '☰' },
];
const DESK_NAV = [
  ['home', '🏠', 'Trip Home'], ['today', '☀️', 'Today'], ['plan', '🗓️', 'Plan'], ['map', '🗺️', 'Map'], ['money', '💴', 'Money'], ['decisions', '🗳️', 'Decisions'], ['inbox', '📥', 'Inbox'], ['brain', '✨', 'Trip Brain'], ['health', '🩺', 'Trip Health'], ['documents', '📄', 'Documents'], ['travellers', '👥', 'Travellers'], ['history', '🕘', 'Activity'], ['memories', '📸', 'Memories'], ['settings', '⚙️', 'Settings'],
];
const ONBOARD = ['welcome', 'create', 'invite', 'join', 'signin'];
function navGroup() {
  const n = route.name;
  if (['home', 'today'].includes(n)) return 'today';
  if (['plan', 'item', 'activity-add'].includes(n)) return 'plan';
  if (n === 'map') return 'map';
  if (['money', 'expense-add', 'scan', 'receipt', 'itemise', 'split', 'settle', 'expense'].includes(n)) return 'money';
  return 'more';
}


/* ---------- Looks ---------- */
const LOOKS = [
  { id: 'classic', name: 'Classic', sw: ['#F1F5F4', '#0F766E', '#E8541E', '#16232E'] },
  { id: 'postcard', name: 'Postcard', sw: ['#FFF6E5', '#FFD43B', '#1E9BD7', '#FF6B4A'] },
  { id: 'gummy', name: 'Gummy', sw: ['#F3F0FF', '#7C5CFF', '#FF5CA8', '#B8F2E6'] },
  { id: 'journal', name: 'Journal', sw: ['#FBF7EE', '#3C7A5A', '#E2503C', '#F6C453'] },
  { id: 'metro', name: 'Metro', sw: ['#FFFFFF', '#F39700', '#009BBF', '#111418'] },
];
let look = 'classic';
function setLook(id, silent) {
  look = LOOKS.some(l => l.id === id) ? id : 'classic';
  if (look === 'classic') delete document.documentElement.dataset.look; else document.documentElement.dataset.look = look;
  try { localStorage.setItem('onetrip-look', look); } catch (e) {}
  const sel = $('#lookselect'); if (sel) sel.value = look;
  if (!silent) { render(); toast(LOOKS.find(l => l.id === look).name + ' look', 'Remembered on this device'); }
}
function syncDark() {
  const t = document.documentElement.dataset.theme;
  const dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.dark = dark ? '1' : '';
}
function lookPicker() { return `<div class="looks">${LOOKS.map(l => `<button class="look ${look === l.id ? 'on' : ''}" onclick="setLook('${l.id}')"><span class="sw">${l.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>${l.name}</button>`).join('')}</div>`; }
function lookSheet() { openSheet(`<h2 class="h2">Choose a look</h2><p class="sub mb12">Same trip, same data, a different mood. Everyone picks their own.</p>${lookPicker()}<button class="btn block mt16" onclick="closeSheet()">Done</button>`); }

/* ---------- Layout ---------- */
let layoutPref = 'phone';
function setLayout(l) { layoutPref = l; try { localStorage.setItem('onetrip-layout', l); } catch (e) {} applyLayout(); }
function applyLayout() {
  const wide = window.innerWidth >= 900;
  document.body.classList.toggle('wide', wide);
  const useDesktop = wide && layoutPref === 'desktop';
  document.body.classList.toggle('phone', wide && !useDesktop);
  $('#app').className = useDesktop ? 'desktop' : 'mobile';
  $('#seg-phone').classList.toggle('on', !useDesktop);
  $('#seg-desktop').classList.toggle('on', useDesktop);
}
const isDesktop = () => $('#app').classList.contains('desktop');
window.addEventListener('resize', () => { applyLayout(); render(); });

/* ---------- Sheets & toasts ---------- */
function openSheet(html) { const o = $('#overlay'); o.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`; o.classList.add('open'); }
function closeSheet(silent) { const o = $('#overlay'); o.classList.remove('open'); o.innerHTML = ''; }
function toast(text, sub, action) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${text}${sub ? `<span class="sub">${sub}</span>` : ''}</span>${action ? `<button>${action.label}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.remove(); action.fn(); };
  $('#toast').appendChild(t); setTimeout(() => t.remove(), action ? 6000 : 3600);
}
function loadingSheet(text, ms, then) {
  openSheet(`<div class="loading"><div class="spinner"></div><div class="h3">${text}</div></div>`);
  setTimeout(then, ms);
}

/* ---------- Global Add ---------- */
function openAdd() {
  openSheet(h`
    <h2 class="h2">Add to trip</h2>
    <p class="sub mb16">Anything you add is connected to ${esc(S.trip.name)}.</p>
    <div class="addgrid">
      ${[['📍', 'Place', "go('map')"], ['📅', 'Activity', "go('activity-add')"], ['🏨', 'Booking', "go('inbox',{auto:'pdf'})"], ['💰', 'Expense', "go('expense-add')"], ['🧾', 'Receipt', "go('scan')"],
        ['📄', 'Document', "go('inbox')"], ['🗳', 'Decision', "newDecisionSheet()"], ['📝', 'Note', "noteSheet()"], ['🎤', 'Voice', "voiceSheet()"], ['📷', 'Photo', "go('inbox',{auto:'photo'})"]]
        .map(([e, l, fn]) => `<button onclick="closeSheet();${fn}"><span class="e">${e}</span>${l}</button>`).join('')}
    </div>`);
}
function noteSheet() {
  openSheet(h`<h2 class="h2">Add a note</h2><p class="sub mb12">Notes stay with the trip so everyone can see them.</p>
    <textarea class="input" id="note-text" placeholder="e.g. Bring passports for tax-free shopping"></textarea>
    <div class="actions"><button class="btn" onclick="closeSheet()">Cancel</button><button class="btn primary" onclick="saveNote()">Save note</button></div>`);
}
function saveNote() { const v = $('#note-text').value.trim(); if (!v) return; S.notes.push({ id: uid('note'), text: v, who: S.me }); logActivity('Added a note: "' + v + '"'); closeSheet(); toast('Note added', 'Visible to everyone on the trip'); }
function voiceSheet() {
  openSheet(`<h2 class="h2">Add by voice</h2><p class="sub mb16">Say something like “Taxi, 4,800 yen, I paid, split with John and Tom”.</p>
    <div class="loading" style="padding:20px"><div class="thinking"><i></i><i></i><i></i></div><div class="h3">Listening…</div></div>`);
  setTimeout(() => {
    openSheet(`<h2 class="h2">We heard</h2><p class="mid mt8">“Coffee for everyone, 2,400 yen, Jennie paid.”</p>
      <div class="card soft mt16"><div class="row between"><span>☕ Coffee</span><b class="money">¥2,400</b></div><div class="row between tiny mt8"><span>Paid by Jennie · 5 people · Food</span><span>≈ ${fmtHome(2400)}</span></div></div>
      <div class="actions"><button class="btn" onclick="closeSheet()">Discard</button><button class="btn primary" onclick="addExpense({merchant:'Coffee',category:'Food',jpy:2400,payer:'jennie',participants:S.people.map(p=>p.id),emoji:'☕'});closeSheet()">Add expense</button></div>`);
  }, 1400);
}
function newDecisionSheet(placeId) {
  openSheet(h`<h2 class="h2">Start a decision</h2><p class="sub mb12">Ask the group to vote. Every option can be a place, a booking or an idea.</p>
    <div class="field"><label>What are we deciding?</label><input class="input" id="dec-title" value="${placeId ? 'Friday dinner' : ''}" placeholder="e.g. Friday dinner"></div>
    <div class="field mt12"><label>Question</label><input class="input" id="dec-q" value="Where should we eat?"></div>
    ${placeId ? `<div class="card soft mt12 row"><span>${PL(placeId).emoji}</span><b>${esc(PL(placeId).name)}</b><span class="pill accent" style="margin-left:auto">Option 1</span></div>` : ''}
    <div class="actions"><button class="btn" onclick="closeSheet()">Cancel</button><button class="btn primary" onclick="createDecision('${placeId || ''}')">Create decision</button></div>`);
}
function createDecision(placeId) {
  const title = $('#dec-title').value.trim() || 'New decision';
  const d = { id: uid('dec'), title, question: $('#dec-q').value, status: 'open', deadline: '2025-10-17', day: 6, slot: '19:00', category: 'Food', options: [], votes: {}, confirmedOptionId: null };
  if (placeId) { const o = { id: uid('o'), placeId, estPP: PL(placeId).estPP || 4000 }; d.options.push(o); d.votes[o.id] = {}; }
  S.decisions.push(d); logActivity('Started the ' + title + ' decision.'); notify('🗳', 'Jennie started a new decision: ' + title + '.', ['decision', d.id]);
  closeSheet(); go('decision', { id: d.id }); toast('Decision created', 'Your group can vote now');
}

/* ---------- Render ---------- */
function render() {
  const view = $('#view');
  const fn = SCREENS[route.name] || SCREENS.home;
  view.innerHTML = fn(route.p);
  renderNav();
  document.title = 'OneTRIP';
  if (fn.after) fn.after(route.p);
}
function renderNav() {
  const onboarding = ONBOARD.includes(route.name) || route.name === 'travel';
  const bnav = $('#bnav');
  bnav.style.display = onboarding ? 'none' : '';
  const g = navGroup();
  bnav.innerHTML = NAV.map(tab).join('');
  $('#fabwrap').style.display = onboarding ? 'none' : '';
  function tab(n) { return `<button class="tab ${g === n.id ? 'on' : ''}" onclick="go('${n.id === 'today' ? 'home' : n.id}')"><span class="ic">${n.ic}</span>${n.label}${n.id === 'more' && S.notifications.some(x => x.unread) ? '' : ''}</button>`; }
  const sb = $('#sidebar');
  const unread = S.notifications.filter(n => n.unread).length;
  const open = S.decisions.filter(d => d.status !== 'confirmed').length;
  sb.innerHTML = `<div class="logo">OneTRIP</div><div class="tripname"><b>${S.trip.emoji} ${esc(S.trip.name)}</b>${fmtRange()} · ${plural(S.people.length, 'traveller')}</div>
    ${DESK_NAV.map(([id, ic, l]) => `<button class="nav ${isNavOn(id) ? 'on' : ''}" onclick="go('${id}')"><span class="ic">${ic}</span>${l}${id === 'decisions' && open ? `<span class="badge">${open}</span>` : ''}${id === 'settings' && unread ? `<span class="badge">${unread}</span>` : ''}</button>`).join('')}
    <button class="fab add" onclick="openAdd()"><span>+</span> Add to trip</button>
    <button class="nav" onclick="go('travel')"><span class="ic">🧭</span>Travel Mode</button>
    <div class="foot">Signed in as ${me().name} · Owner<br>Reporting in ${S.reporting}</div>`;
  sb.style.display = onboarding && isDesktop() ? 'none' : '';
  const tb = $('#desktop-topbar');
  tb.style.display = onboarding ? 'none' : '';
  tb.innerHTML = `<span class="h3">${screenTitle()}</span><span class="spacer"></span>
    <span class="tiny">Reporting currency</span><select onchange="S.reporting=this.value;render();toast('Now showing amounts in '+this.value,'Original amounts are always kept')">${Object.keys(RATES).map(c => `<option ${S.reporting === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <button class="iconbtn plain" title="Notifications" onclick="go('notifications')">🔔${unread ? `<span class="badge" style="margin-left:-6px;margin-top:-14px">${unread}</span>` : ''}</button>${av(S.me)}`;
}
function isNavOn(id) { const n = route.name; if (id === n) return true; if (id === 'plan' && ['item', 'activity-add'].includes(n)) return true; if (id === 'money' && ['expense-add', 'scan', 'receipt', 'itemise', 'split', 'settle', 'expense'].includes(n)) return true; if (id === 'decisions' && n === 'decision') return true; if (id === 'documents' && ['bookings', 'booking'].includes(n)) return true; if (id === 'settings' && ['notifications', 'permissions'].includes(n)) return true; return false; }
function screenTitle() { const m = { home: 'Trip Home', today: 'Today', plan: 'Plan', map: 'Map', money: 'Money', decisions: 'Group decisions', decision: 'Decision', inbox: 'Trip Inbox', brain: 'Trip Brain', health: 'Trip Health', documents: 'Documents', travellers: 'Travellers', history: 'Activity', memories: 'Memories', settings: 'Settings', notifications: 'Notifications', bookings: 'Bookings' }; return m[route.name] || ''; }
function fmtRange() { return '12–20 October'; }
function pageHead(title, sub, right) { return `<div class="hdr"><div><h1 class="h1">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${right || ''}</div>`; }
function backBtn(label) { return `<button class="back" onclick="back()">‹ ${label || 'Back'}</button>`; }

/* ---------- Shared components ---------- */
function statusPill(i) {
  const m = { confirmed: ['good', 'Confirmed'], completed: ['', 'Done'], proposed: ['accent', 'Proposed'], voting: ['warn', 'Voting'], idea: ['', 'Idea'], cancelled: ['bad', 'Cancelled'] };
  const [t, l] = m[i.status] || ['', i.status]; return `<span class="pill ${t}">${l}</span>`;
}
function bookingPill(i) { if (i.booking === 'booked') return `<span class="pill good">🎟 Booked</span>`; if (i.booking === 'needed') return `<span class="pill bad">Not booked</span>`; return ''; }
function itineraryCard(i, opts) {
  opts = opts || {}; const pl = i.placeId ? PL(i.placeId) : null;
  const n = nowMin(); const isNow = i.day === TODAY_DAY && minutes(i.start) <= n && minutes(i.end) > n;
  const done = i.day < TODAY_DAY || (i.day === TODAY_DAY && minutes(i.end) <= n);
  return h`<div class="tl-item ${done ? 'done' : ''} ${isNow ? 'now' : ''}" data-id="${i.id}">
    <div class="time num">${fmtTime(i.start).replace(' ', '<br>')}</div><div class="knot"></div>
    ${i.travelMin && !opts.noTravel ? `<div class="travel ${opts.conflict ? 'conflict' : ''}">${opts.conflict ? '⚠️' : '↓'} ${i.travelMin} min ${opts.conflict ? 'travel — arrives late' : 'travel'}</div>` : ''}
    <div class="tl-card" draggable="${opts.drag ? 'true' : 'false'}" onclick="go('item',{id:'${i.id}'})">
      <div class="e">${i.emoji}</div>
      <div class="flex1">
        <div class="row between"><span class="t">${esc(i.title)}</span>${opts.menu ? `<button class="menu" onclick="event.stopPropagation();itemMenu('${i.id}')">⋯</button>` : ''}</div>
        <div class="m">${pl ? esc(pl.name) + ' · ' + esc(pl.area) : ''}${i.end && i.end !== i.start ? ' · until ' + fmtTime(i.end) : ''}</div>
        <div class="tags">${statusPill(i)}${bookingPill(i)}${i.costJpy ? `<span class="pill">${fmtHome(i.costJpy)}</span>` : ''}<span style="margin-left:auto">${avs(i.people, 4)}</span></div>
      </div>
    </div></div>`;
}
function healthRow(c) { return `<button class="item tap" onclick="go('${c.go[0]}',${c.go[1] ? `{id:'${c.go[1]}'}` : '{}'})"><span class="dot ${c.tone}"></span><div class="body"><div class="title" style="font-weight:600">${c.text}</div>${c.sub ? `<div class="meta">${c.sub}</div>` : ''}</div>${c.resolve ? `<button class="btn xs primary" onclick="event.stopPropagation();resolveIssue('${c.resolve}','${c.id}')">Resolve</button>` : '<span class="chev">›</span>'}</button>`; }
function donut(parts, total) {
  const r = 52, c = 2 * Math.PI * r; let off = 0;
  const segs = parts.filter(p => p.v > 0).map(p => { const len = (p.v / total) * c; const s = `<circle r="${r}" cx="66" cy="66" fill="none" stroke="${p.color}" stroke-width="16" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 66 66)"/>`; off += len; return s; }).join('');
  return `<svg class="donut" viewBox="0 0 132 132"><circle r="${r}" cx="66" cy="66" fill="none" stroke="var(--line-2)" stroke-width="16"/>${segs}</svg>`;
}

/* ---------- Screens ---------- */
const SCREENS = {};

SCREENS.welcome = () => h`
  <div class="welcome">
    <div class="logo">OneTRIP</div>
    <h1 class="h1">One trip.<br>Everyone together.</h1>
    <p class="sub" style="font-size:16px">Plan, decide, spend and travel together in one shared trip.</p>
    <div class="art">${welcomeArt()}</div>
    <div class="fragments"><span>WhatsApp</span><span>Google Maps</span><span>Notes</span><span>Spreadsheet</span><span>Calendar</span><span>Email</span><span>Splitwise</span><span>Booking sites</span><span>Camera roll</span><span class="keep">One trip</span></div>
    <div class="stack">
      <button class="btn primary lg block" onclick="go('create',{step:1})">Create a trip</button>
      <button class="btn outline lg block" onclick="go('join')">Join a trip</button>
      <p class="center tiny mt8">Already have an account? <button class="link" onclick="go('signin')">Sign in</button> · <button class="link" onclick="go('home')">Open the demo trip</button></p>
    </div>
  </div>`;
function welcomeArt() {
  return `<svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><clipPath id="wc"><rect x="0" y="0" width="380" height="220" rx="22"/></clipPath></defs>
    <g clip-path="url(#wc)">
      <rect width="380" height="220" fill="var(--surface)"/>
      <rect x="0" y="150" width="380" height="70" fill="var(--map-water)"/>
      <path d="M0 150 Q 90 130 190 150 T 380 150 V 220 H 0 Z" fill="var(--map-water)"/>
      <rect x="30" y="20" width="120" height="120" rx="14" fill="var(--map-park)"/>
      <path d="M0 96 H380 M170 0 V220 M250 0 V220 M0 40 H380" stroke="var(--map-road)" stroke-width="6" fill="none"/>
      <path d="M0 96 H380 M170 0 V220 M250 0 V220" stroke="var(--line)" stroke-width="1" fill="none"/>
      <path d="M70 96 L170 60 L250 96 L320 62" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 5" fill="none" stroke-linecap="round"/>
      <g font-family="var(--font-display)" font-size="11" font-weight="600" fill="var(--ink)">
        <circle cx="70" cy="96" r="14" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/><text x="70" y="100" text-anchor="middle" font-size="13">🏨</text>
        <circle cx="170" cy="60" r="14" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/><text x="170" y="64" text-anchor="middle" font-size="13">⛩️</text>
        <circle cx="250" cy="96" r="14" fill="var(--surface)" stroke="var(--spark)" stroke-width="3"/><text x="250" y="100" text-anchor="middle" font-size="13">🍣</text>
        <circle cx="320" cy="62" r="14" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/><text x="320" y="66" text-anchor="middle" font-size="13">🎨</text>
      </g>
      <g transform="translate(212 128)"><rect width="150" height="66" rx="12" fill="var(--surface)" stroke="var(--line)"/><text x="12" y="20" font-family="var(--font-body)" font-size="10" font-weight="700" fill="var(--text-3)">SATURDAY DINNER</text><text x="12" y="38" font-family="var(--font-display)" font-size="12" font-weight="600" fill="var(--ink)">Sushi House · ❤️ 4</text><rect x="12" y="46" width="126" height="6" rx="3" fill="var(--line-2)"/><rect x="12" y="46" width="88" height="6" rx="3" fill="var(--accent)"/></g>
      <g transform="translate(24 158)"><rect width="140" height="46" rx="12" fill="var(--surface)" stroke="var(--line)"/><text x="12" y="19" font-family="var(--font-body)" font-size="10" font-weight="700" fill="var(--text-3)">SPENT · 5 PEOPLE</text><text x="12" y="37" font-family="var(--font-display)" font-size="14" font-weight="600" fill="var(--ink)">¥371,560 ≈ $3,740</text></g>
      <g transform="translate(290 14)">${['#0F766E', '#2457C5', '#B45309', '#6D28D9', '#BE185D'].map((c, i) => `<circle cx="${i * 14}" cy="10" r="9" fill="${c}" stroke="var(--surface)" stroke-width="2"/>`).join('')}</g>
    </g></svg>`;
}

SCREENS.signin = () => h`<div class="screen" style="max-width:440px"><div style="padding-top:24px">${backBtn('Welcome')}
  <h1 class="h1 mb16">Sign in</h1>
  <div class="stack"><div class="field"><label>Email</label><input class="input" value="jennie@example.com"></div>
  <div class="field"><label>Password</label><input class="input" type="password" value="••••••••••"></div>
  <button class="btn primary lg block" onclick="go('home')">Sign in</button>
  <p class="tiny center">Prototype only — no real account is created.</p></div></div></div>`;

SCREENS.join = () => h`<div class="screen" style="max-width:440px"><div style="padding-top:24px">${backBtn('Welcome')}
  <h1 class="h1">Join a trip</h1><p class="sub mb16">Enter the code your friend shared. You can preview before you join.</p>
  <input class="input big mono center" id="join-code" value="TOKYO-82K" style="letter-spacing:.15em">
  <button class="btn primary lg block mt16" onclick="joinPreview()">Preview trip</button>
  <p class="tiny center mt12">Or open a link like <span class="mono">onetrip.app/join/TOKYO82</span></p></div></div>`;
function joinPreview() {
  loadingSheet('Finding this trip…', 900, () => openSheet(h`
    <div class="row mb12"><span style="font-size:36px">🗼</span><div><div class="h2">Tokyo Trip</div><div class="sub">12–20 October · 5 travellers</div></div></div>
    <div class="row mb12">${avs(S.people.map(p => p.id))}<span class="tiny">Jennie, John, Mary, Tom, Sarah</span></div>
    <div class="card soft"><div class="row between tiny"><span>Itinerary</span><b>${S.itinerary.length} plans over 9 days</b></div><div class="row between tiny mt8"><span>Open decisions</span><b>${S.decisions.filter(d => d.status !== 'confirmed').length}</b></div><div class="row between tiny mt8"><span>Budget</span><b>AUD $5,000 · JPY</b></div></div>
    <p class="tiny mt12">Joining as a guest lets you see the plan and vote. Create an account later to add expenses.</p>
    <div class="actions"><button class="btn" onclick="closeSheet()">Not now</button><button class="btn primary" onclick="closeSheet();go('home');toast('Welcome to Tokyo Trip 🎉','You can vote and see the plan right away')">Join as guest</button></div>`));
}

/* ----- Create trip ----- */
const draft = { destination: 'Tokyo, Japan', start: '2025-10-12', end: '2025-10-20', styles: ['Balanced', 'Food'], budget: 5000, currency: 'JPY', home: 'AUD' };
SCREENS.create = ({ step }) => {
  step = step || 1;
  const bar = `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (step === 1) body = h`<h1 class="h1">Where are you going?</h1><p class="sub mb16">Start with the basics. You can change everything later.</p>
    <div class="stack">
      <div class="field"><label>Destination</label><input class="input" id="c-dest" value="${esc(draft.destination)}" placeholder="Search destination" oninput="draft.destination=this.value"></div>
      <div class="grid2"><div class="field"><label>Start date</label><input class="input" type="date" value="${draft.start}" onchange="draft.start=this.value"></div><div class="field"><label>End date</label><input class="input" type="date" value="${draft.end}" onchange="draft.end=this.value"></div></div>
      <div class="card soft row"><span>🗼</span><div class="flex1"><b>Tokyo, Japan</b><div class="tiny">JPY detected · 9 days · 10 hours ahead of Sydney</div></div></div>
    </div>
    <button class="btn primary lg block mt24" onclick="go('create',{step:2})">Continue</button>`;
  if (step === 2) body = h`<h1 class="h1">Who's coming and what kind of trip?</h1><p class="sub mb16">Add yourself now. Invite the others in a moment.</p>
    <div class="list mb16"><div class="item">${av('jennie')}<div class="body"><div class="title">Jennie (you)</div><div class="meta">Owner</div></div><span class="pill good">Added</span></div>
      <div class="item"><span class="avatar" style="background:var(--surface-2);color:var(--text-3)">+</span><div class="body"><div class="title" style="color:var(--text-2)">Invite others later</div><div class="meta">Share a link or code after you create the trip</div></div></div></div>
    <div class="eyebrow mb8">Trip style · pick any</div>
    <div class="optcards" id="styles">${[['🧘', 'Relaxed'], ['⚖️', 'Balanced'], ['⚡', 'Busy'], ['🥾', 'Adventure'], ['🍜', 'Food'], ['👨‍👩‍👧', 'Family'], ['💸', 'Budget'], ['💎', 'Luxury']].map(([e, l]) => `<button class="optcard ${draft.styles.includes(l) ? 'on' : ''}" onclick="toggleStyle('${l}',this)"><span class="e">${e}</span>${l}</button>`).join('')}</div>
    <div class="actions"><button class="btn" onclick="go('create',{step:1})">Back</button><button class="btn primary" onclick="go('create',{step:3})">Continue</button></div>`;
  if (step === 3) body = h`<h1 class="h1">Budget and currency</h1><p class="sub mb16">Optional. OneTRIP tracks spending in yen and reports in your home currency.</p>
    <div class="stack">
      <div class="field"><label>Group budget (optional)</label><div class="inputrow"><select class="input" style="width:100px" onchange="draft.home=this.value"><option>AUD</option><option>USD</option><option>GBP</option><option>EUR</option></select><input class="input big num" value="5,000" style="flex:1"></div></div>
      <div class="field"><label>Trip currency</label><div class="row"><select class="input" onchange="draft.currency=this.value"><option>JPY — Japanese yen</option><option>USD</option><option>AUD</option></select></div><span class="tiny">Detected from Tokyo, Japan. Rate today: 1 AUD = 99.35 JPY.</span></div>
    </div>
    <div class="actions"><button class="btn" onclick="go('create',{step:2})">Back</button><button class="btn primary" onclick="createTrip()">Create trip</button></div>`;
  return `<div class="screen" style="max-width:520px"><div style="padding-top:16px">${step === 1 ? backBtn('Welcome') : ''}${bar}${body}</div></div>`;
};
function toggleStyle(l, el) { const i = draft.styles.indexOf(l); if (i >= 0) draft.styles.splice(i, 1); else draft.styles.push(l); el.classList.toggle('on'); }
function createTrip() { S.trip.styles = draft.styles.slice(); loadingSheet('Setting up your trip…', 900, () => { closeSheet(); go('invite', {}, { replace: true }); }); }

SCREENS.invite = () => h`<div class="screen" style="max-width:520px"><div style="padding-top:16px">
  <div class="row mb12"><span style="font-size:34px">🗼</span><div><div class="eyebrow">Tokyo Trip</div><div class="tiny">${av('jennie', 'sm')} Jennie — Owner</div></div></div>
  <h1 class="h1">Invite your travel group</h1><p class="sub mb16">Everyone can add plans, vote and track expenses together.</p>
  <div class="card mb12"><div class="eyebrow mb8">Invite link</div><div class="row between"><span class="mono">onetrip.app/join/TOKYO82</span><button class="btn sm" onclick="toast('Link copied')">Copy</button></div><div class="divider"></div><div class="eyebrow mb8">Join with code</div><div class="row between"><kbd class="code">TOKYO-82K</kbd>${qr()}</div></div>
  <div class="grid3 mb16">${[['🔗', 'Share link'], ['💬', 'WhatsApp'], ['📱', 'SMS'], ['📧', 'Email'], ['📷', 'QR code'], ['📋', 'Copy link']].map(([e, l]) => `<button class="card tap center" style="padding:12px 6px" onclick="toast('${l === 'Copy link' ? 'Link copied' : 'Invite sent via ' + l}','Friends can preview the trip before joining')"><div style="font-size:24px">${e}</div><div class="tiny" style="font-weight:700;color:var(--ink)">${l}</div></button>`).join('')}</div>
  <div class="list mb16">${S.people.map(p => `<div class="item">${av(p.id)}<div class="body"><div class="title">${p.name}${p.id === 'jennie' ? ' (you)' : ''}</div><div class="meta">${p.role === 'owner' ? 'Owner' : 'Traveller'}</div></div><span class="pill ${p.joined ? 'good' : ''}">${p.joined ? 'Joined' : 'Invited'}</span></div>`).join('')}</div>
  <button class="btn primary lg block" onclick="go('home',{},{replace:true});toast('Your trip is ready','Everyone sees the same plan, decisions and money')">Go to trip</button>
  <p class="tiny center mt12">Travellers can preview the trip before creating an account.</p></div></div>`;
function qr() { const pat = [1,1,1,0,1,0,1,1,1, 1,0,1,0,0,1,1,0,1, 1,1,1,1,0,0,1,1,1, 0,0,0,1,1,0,0,0,0, 1,0,1,0,1,1,0,1,0, 0,1,0,1,0,0,1,0,1, 1,1,1,0,1,0,1,0,0, 1,0,1,1,0,1,0,1,1, 1,1,1,0,0,1,1,0,1]; return `<div class="qr">${pat.map(b => `<i class="${b ? '' : 'o'}"></i>`).join('')}</div>`; }

/* ----- Trip Home ----- */
SCREENS.home = () => {
  const nxt = nextItem(); const cur = currentItem();
  const spent = spentJpy(), bud = budgetJpy(), fc = forecastJpy();
  const openDec = S.decisions.filter(d => d.status !== 'confirmed');
  const checks = healthChecks();
  const notes = S.notes.length;
  const left = h`
    <div class="card accent" style="padding:18px">
      <div class="row between"><span class="eyebrow accent">Next</span><span class="tiny">${dayLabel(TODAY_DAY)} · now ${fmtTime('09:25')}</span></div>
      ${nxt ? `<div class="row mt8" style="gap:14px;cursor:pointer" onclick="go('item',{id:'${nxt.id}'})"><span style="font-size:40px">${nxt.emoji}</span><div class="flex1"><div class="mid">${esc(nxt.title)}</div><div class="sub">${fmtTime(nxt.start)} · ${esc(PL(nxt.placeId).name)}</div><div class="tiny mt8">🚇 ${nxt.travelMin || 15} min from your current location${cur ? ' · you are at ' + esc(PL(cur.placeId).name) : ''}</div></div><span class="chev">›</span></div>` : '<p class="sub">Nothing else planned today.</p>'}
      <div class="row mt12" style="gap:8px"><button class="btn sm primary" onclick="go('map',{focus:'${nxt ? nxt.placeId : 'hilton'}'})">Directions</button><button class="btn sm outline" onclick="go('travel')">Travel Mode</button></div>
    </div>
    <div class="section"><div class="eyebrow">Today <button onclick="go('today')">Full day ›</button></div>
      <div class="list">${todayItems().map(i => `<button class="item tap" onclick="go('item',{id:'${i.id}'})"><span class="num" style="width:66px;flex-shrink:0;white-space:nowrap;font-weight:700;color:var(--text-2);font-size:13px">${fmtTime(i.start)}</span><span>${i.emoji}</span><div class="body"><div class="title" style="font-weight:600">${esc(i.title)}</div></div>${bookingPill(i)}</button>`).join('')}</div></div>
    <div class="section"><div class="eyebrow">Group decision <button onclick="go('decisions')">All decisions ›</button></div>
      ${openDec.length ? openDec.slice(0, isDesktop() ? 3 : 1).map(d => decisionCard(d)).join('') : `<div class="card soft"><b>Nothing to decide right now.</b><div class="tiny">Save a place and ask the group to vote.</div></div>`}</div>`;
  const right = h`
    <div class="section" style="${isDesktop() ? 'margin-top:0' : ''}"><div class="eyebrow">Money <button onclick="go('money')">Details ›</button></div>
      <div class="card">
        <div class="kpis" style="grid-template-columns:1fr 1fr;gap:6px 14px">
          <div><div class="tiny">Budget</div><div class="mid">${fmtHome(bud, { dec: 0 })}</div></div>
          <div><div class="tiny">Spent</div><div class="mid">${fmtHome(spent, { dec: 0 })}</div></div>
          <div><div class="tiny">Remaining</div><div class="mid" style="color:var(--good)">${fmtHome(bud - spent, { dec: 0 })}</div></div>
          <div><div class="tiny">Forecast</div><div class="mid" style="color:${fc > bud ? 'var(--warn)' : 'var(--ink)'}">${fmtHome(fc, { dec: 0 })}</div></div>
        </div>
        <div class="bar mt12"><i style="width:${Math.min(100, spent / bud * 100)}%"></i><i class="ghost" style="width:${Math.max(0, Math.min(100 - spent / bud * 100, (fc - spent) / bud * 100))}%"></i></div>
        ${fc > bud ? `<div class="warnbox mt12">⚠️<span>You may finish about <b>${fmtHome(fc - bud, { dec: 0 })}</b> over budget. Forecast includes the hotel balance, the Fuji tour and Saturday dinner.</span></div>` : `<div class="goodbox mt12">✅<span>On track to finish under budget.</span></div>`}
      </div></div>
    <div class="section"><div class="eyebrow">Trip health <button onclick="go('health')">Open ›</button></div>
      <div class="list">${checks.slice(0, 5).map(c => `<button class="item tap" onclick="go('${c.go[0]}',${c.go[1] ? `{id:'${c.go[1]}'}` : '{}'})"><span class="dot ${c.tone}"></span><div class="body"><div class="title" style="font-weight:600;font-size:14.5px">${c.text}</div></div><span class="chev">›</span></button>`).join('')}</div></div>
    ${notes ? `<div class="section"><div class="eyebrow">Notes</div><div class="list">${S.notes.map(n => `<div class="item"><span>📝</span><div class="body"><div class="title" style="font-weight:600">${esc(n.text)}</div><div class="meta">${P(n.who).name}</div></div></div>`).join('')}</div></div>` : ''}`;
  return h`<div class="screen">
    <div class="hdr"><div><div class="eyebrow">${S.trip.emoji} ${esc(S.trip.name)} · ${plural(S.people.length, 'traveller')}</div><h1 class="h1">Tokyo</h1><p class="sub">${fmtRange()} · Day ${TODAY_DAY} of 9</p></div>
      <div class="col" style="align-items:flex-end;gap:6px"><button onclick="go('travellers')">${avs(S.people.map(p => p.id))}</button><div class="row" style="gap:6px"><button class="iconbtn" onclick="lookSheet()" aria-label="Choose a look" title="Choose a look">🎨</button><button class="iconbtn" onclick="go('notifications')" aria-label="Notifications">🔔${S.notifications.some(n => n.unread) ? `<span class="badge" style="position:absolute;margin:-22px 0 0 22px">${S.notifications.filter(n => n.unread).length}</span>` : ''}</button></div></div></div>
    <div class="dgrid"><div>${left}</div><div>${right}</div></div>
    <div class="section"><div class="eyebrow">Shortcuts</div><div class="grid4">${[['✨', 'Trip Brain', 'brain'], ['📥', 'Inbox', 'inbox'], ['📄', 'Documents', 'documents'], ['🕘', 'Activity', 'history']].map(([e, l, r]) => `<button class="card tap center" style="padding:12px 4px" onclick="go('${r}')"><div style="font-size:22px">${e}</div><div class="tiny" style="font-weight:700;color:var(--ink)">${l}</div></button>`).join('')}</div></div>
  </div>`;
};
function decisionCard(d) {
  const st = decisionStatus(d); const n = votersOf(d).size; const lead = leadingOption(d); const myVote = Object.values(d.votes).some(v => v[S.me]);
  const dl = new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  return h`<div class="card tap" onclick="go('decision',{id:'${d.id}'})">
    <div class="row between top"><div><div class="h3">${esc(d.title)}</div><div class="tiny">${esc(d.question)} · closes ${dl}</div></div><span class="pill ${st.tone}">${st.label}</span></div>
    <div class="row mt12"><div class="bar flex1"><i class="${d.status === 'confirmed' ? 'good' : ''}" style="width:${n / S.people.length * 100}%"></i></div><span class="tiny num" style="font-weight:700">${n} / ${S.people.length} voted</span></div>
    <div class="row between mt12"><span class="tiny">${d.status === 'confirmed' ? '✅ ' + esc(optionName(d.options.find(o => o.id === d.confirmedOptionId))) : lead ? 'Leading: <b>' + esc(optionName(lead)) + '</b> · ≈ ' + fmtHome(lead.estPP) + '/person' : 'No options yet'}</span>${d.status !== 'confirmed' && !myVote ? '<span class="pill spark">Needs your vote</span>' : ''}</div></div>`;
}

/* ----- Today ----- */
SCREENS.today = () => {
  const items = todayItems(); const n = nowMin();
  const cur = currentItem(); const nxt = nextItem(); const later = items.filter(i => minutes(i.start) > n && i !== nxt);
  const spent = spentJpy(), bud = budgetJpy();
  const openDec = S.decisions.filter(d => d.status !== 'confirmed' && !Object.values(d.votes).some(v => v[S.me]));
  const block = (label, i, extra) => i ? `<div class="section"><div class="eyebrow">${label}</div><div class="card tap row" style="gap:14px" onclick="go('item',{id:'${i.id}'})"><span style="font-size:32px">${i.emoji}</span><div class="flex1"><div class="mid">${esc(i.title)}</div><div class="sub">${fmtTime(i.start)} · ${esc(PL(i.placeId).name)}</div>${extra ? `<div class="tiny mt8">${extra}</div>` : ''}</div><span class="chev">›</span></div></div>` : '';
  return h`<div class="screen">
    ${pageHead('Today', dayLabel(TODAY_DAY, true), `<button class="btn sm outline" onclick="go('travel')">🧭 Travel Mode</button>`)}
    <div class="dgrid"><div>
    ${cur ? block('Now', cur, 'Ends ' + fmtTime(cur.end)) : `<div class="section"><div class="eyebrow">Now</div><div class="card soft"><b>Free until ${nxt ? fmtTime(nxt.start) : 'tonight'}</b><div class="tiny">Nothing scheduled right now.</div></div></div>`}
    ${block('Next', nxt, nxt ? '🚇 ' + (nxt.travelMin || 10) + ' min away' + (nxt.booking === 'booked' ? ' · 🎟 booked' : '') : '')}
    ${later.length ? `<div class="section"><div class="eyebrow">Later</div><div class="list">${later.map(i => `<button class="item tap" onclick="go('item',{id:'${i.id}'})"><span class="ic">${i.emoji}</span><div class="body"><div class="title">${esc(i.title)}</div><div class="meta">${fmtTime(i.start)} · ${esc(PL(i.placeId).name)}</div></div>${i.costJpy ? `<span class="tiny">${fmtHome(i.costJpy)}</span>` : ''}</button>`).join('')}</div></div>` : ''}
    </div><div>
    <div class="section"><div class="eyebrow">Trip money <button onclick="go('money')">Open ›</button></div><div class="card"><div class="tiny">You have spent</div><div class="row" style="align-items:baseline;gap:6px"><span class="big">${fmtHome(spent, { dec: 0 })}</span><span class="sub">/ ${fmtHome(bud, { dec: 0 })}</span></div><div class="bar mt12"><i style="width:${spent / bud * 100}%"></i></div><div class="tiny mt8">${myBalanceText()}</div></div></div>
    ${openDec.length ? `<div class="section"><div class="eyebrow">Action needed</div>${openDec.map(d => `<button class="card tap row" style="width:100%;text-align:left" onclick="go('decision',{id:'${d.id}'})"><span style="font-size:24px">🗳</span><div class="flex1"><b>Vote for ${esc(d.title.toLowerCase())}.</b><div class="tiny">${votersOf(d).size} of ${S.people.length} have voted</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
    </div></div></div>`;
};
function myBalanceText() {
  const net = balances()[S.me]; if (Math.abs(net) < 50) return "You're settled up with everyone.";
  const plan = settlementPlan(); const mine = plan.filter(p => p.from === S.me || p.to === S.me);
  return mine.map(p => p.from === S.me ? `You owe ${P(p.to).name} ${fmtHome(p.jpy)}` : `${P(p.from).name} owes you ${fmtHome(p.jpy)}`).join(' · ');
}

/* ----- Plan ----- */
let planTab = 'timeline', planDay = TODAY_DAY;
SCREENS.plan = ({ day, tab }) => {
  if (day) planDay = Number(day); if (tab) planTab = tab;
  const items = itemsOnDay(planDay);
  const conflicts = dayConflicts(planDay);
  const timeline = items.length ? `<div class="tl" id="tl">${items.map(i => itineraryCard(i, { menu: true, drag: true, conflict: conflicts.has(i.id) })).join('')}</div>` : `<div class="empty"><div class="e">🗓️</div><div class="h3">Nothing planned for ${dayLabel(planDay)}</div><p>Add an activity or ask Trip Brain for ideas.</p><button class="btn primary mt12" onclick="go('activity-add',{day:${planDay}})">Add activity</button></div>`;
  const strip = `<div class="daystrip">${DAY_DATES.map((d, i) => { const dd = new Date(d + 'T00:00:00'); return `<button class="daybtn ${planDay === i + 1 ? 'on' : ''} ${i + 1 === TODAY_DAY ? 'today' : ''}" onclick="go('plan',{day:${i + 1}},{replace:true})"><div class="d">${dd.toLocaleDateString('en-AU', { weekday: 'short' })}</div><div class="n">${dd.getDate()}</div><div class="c">${itemsOnDay(i + 1).length} plans</div></button>`; }).join('')}</div>`;
  const cal = `<div class="calgrid">${DAY_DATES.map((d, i) => { const dd = new Date(d + 'T00:00:00'); const it = itemsOnDay(i + 1); return `<div class="calday ${i + 1 === TODAY_DAY ? 'today' : ''}" onclick="go('plan',{day:${i + 1},tab:'timeline'},{replace:true})"><div class="dn">Day ${i + 1}</div><div class="dl">${dd.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</div>${it.slice(0, 4).map(x => `<div class="ev">${x.emoji} ${esc(x.title)}</div>`).join('')}${it.length > 4 ? `<div class="ev">+${it.length - 4} more</div>` : ''}${it.some(x => x.booking === 'needed') ? '<span class="pill bad mt8">Not booked</span>' : ''}</div>`; }).join('')}</div>`;
  const dayCost = items.reduce((a, i) => a + (i.costJpy || 0), 0);
  const main = planTab === 'timeline' ? `<div class="mt16">${strip}</div>
    <div class="row between mt12 mb12"><div><div class="h3">${dayLabel(planDay, true)}</div><div class="tiny">${plural(items.length, 'plan')} · est. ${fmtHome(dayCost)} · ${conflicts.size ? `<span style="color:var(--bad);font-weight:700">${conflicts.size} travel conflict</span>` : 'no conflicts'}</div></div><button class="btn sm primary" onclick="go('activity-add',{day:${planDay}})">+ Activity</button></div>${timeline}` : `<div class="mt16">${cal}</div>`;
  return h`<div class="screen wide">
    ${pageHead('Plan', 'Itinerary and calendar — everyone edits the same one.', `<div class="tabs" style="min-width:200px"><button class="${planTab === 'timeline' ? 'on' : ''}" onclick="go('plan',{tab:'timeline'},{replace:true})">Timeline</button><button class="${planTab === 'calendar' ? 'on' : ''}" onclick="go('plan',{tab:'calendar'},{replace:true})">Calendar</button></div>`)}
    ${isDesktop() && planTab === 'timeline' ? `<div class="dgrid"><div>${main}</div><div style="position:sticky;top:80px"><div class="eyebrow mb8">${dayLabel(planDay)} on the map</div>${mapSvg({ day: planDay, compact: true })}<p class="tiny mt8">Drag cards to reorder. Times shift automatically.</p></div></div>` : main}
  </div>`;
};
SCREENS.plan.after = () => { if (planTab === 'timeline') initDrag(); };
function dayConflicts(day) {
  const items = itemsOnDay(day); const s = new Set();
  for (let k = 1; k < items.length; k++) { const prev = items[k - 1], cur = items[k]; if (cur.travelMin && minutes(prev.end) + cur.travelMin > minutes(cur.start) + 5) s.add(cur.id); }
  return s;
}
function initDrag() {
  const tl = $('#tl'); if (!tl) return; let dragId = null;
  tl.querySelectorAll('.tl-card').forEach(card => {
    const id = card.parentElement.dataset.id;
    card.addEventListener('dragstart', e => { dragId = id; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('over'); });
    card.addEventListener('dragleave', () => card.classList.remove('over'));
    card.addEventListener('drop', e => { e.preventDefault(); card.classList.remove('over'); if (dragId && dragId !== id) reorderItem(dragId, id); });
  });
}
function reorderItem(fromId, toId) {
  const a = IT(fromId), b = IT(toId); if (!a || !b || a.day !== b.day) return;
  const items = itemsOnDay(a.day); const starts = items.map(i => [i.start, i.end]);
  const order = items.filter(i => i.id !== fromId); const idx = order.findIndex(i => i.id === toId); order.splice(idx, 0, a);
  order.forEach((i, k) => { const dur = minutes(i.end) - minutes(i.start); i.start = starts[k][0]; i.end = toHM(minutes(starts[k][0]) + dur); });
  logActivity(`Moved ${a.title} to ${fmtTime(a.start)} on ${dayLabel(a.day)}.`); notify('📍', `Jennie moved ${a.title} to ${fmtTime(a.start)}.`, ['plan', a.day]);
  render(); toast('Reordered', `${a.title} is now at ${fmtTime(a.start)}`);
}
function toHM(m) { m = Math.max(0, Math.min(23 * 60 + 59, m)); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function itemMenu(id) {
  const i = IT(id);
  openSheet(h`<div class="row mb12"><span style="font-size:26px">${i.emoji}</span><div><div class="h3">${esc(i.title)}</div><div class="tiny">${dayLabel(i.day)} · ${fmtTime(i.start)}</div></div></div>
    <div class="menu">
      <button onclick="closeSheet();go('activity-add',{edit:'${id}'})"><span class="ic">✏️</span>Edit</button>
      <button onclick="moveSheet('${id}')"><span class="ic">📆</span>Move</button>
      <button onclick="duplicateItem('${id}')"><span class="ic">📄</span>Duplicate</button>
      <button onclick="itemNote('${id}')"><span class="ic">📝</span>Add note</button>
      <button onclick="closeSheet();go('inbox',{auto:'pdf',itemId:'${id}'})"><span class="ic">🎟</span>Add booking</button>
      <button onclick="setItemStatus('${id}','cancelled')"><span class="ic">🚫</span>Cancel</button>
      <button class="danger" onclick="deleteItem('${id}')"><span class="ic">🗑</span>Delete</button>
    </div>`);
}
function moveSheet(id) {
  const i = IT(id);
  openSheet(h`<h2 class="h2">Move ${esc(i.title)}</h2><p class="sub mb12">Pick a day and a start time.</p>
    <div class="grid2"><div class="field"><label>Day</label><select class="input" id="mv-day">${DAY_DATES.map((d, k) => `<option value="${k + 1}" ${i.day === k + 1 ? 'selected' : ''}>${dayLabel(k + 1)}</option>`).join('')}</select></div><div class="field"><label>Start</label><input class="input" type="time" id="mv-time" value="${i.start}"></div></div>
    <div class="actions"><button class="btn" onclick="closeSheet()">Cancel</button><button class="btn primary" onclick="moveItem('${id}')">Move</button></div>`);
}
function moveItem(id) {
  const i = IT(id); const dur = minutes(i.end) - minutes(i.start); i.day = Number($('#mv-day').value); i.start = $('#mv-time').value; i.end = toHM(minutes(i.start) + dur);
  logActivity(`Moved ${i.title} to ${dayLabel(i.day)} at ${fmtTime(i.start)}.`); notify('📍', `${i.title} moved to ${dayLabel(i.day)} ${fmtTime(i.start)}.`, ['plan', i.day]);
  closeSheet(); planDay = i.day; render(); toast('Moved', `${i.title} → ${dayLabel(i.day)}, ${fmtTime(i.start)}`);
}
function duplicateItem(id) { const i = IT(id); const c = Object.assign({}, i, { id: uid('i'), title: i.title + ' (copy)', bookingId: null, booking: i.booking === 'booked' ? 'needed' : i.booking, status: 'proposed' }); S.itinerary.push(c); logActivity('Duplicated ' + i.title + '.'); closeSheet(); render(); toast('Duplicated', 'Marked as proposed until the group confirms'); }
function itemNote(id) { const i = IT(id); openSheet(h`<h2 class="h2">Note for ${esc(i.title)}</h2><textarea class="input mt12" id="in-text">${esc(i.note || '')}</textarea><div class="actions"><button class="btn" onclick="closeSheet()">Cancel</button><button class="btn primary" onclick="IT('${id}').note=$('#in-text').value;logActivity('Added a note to ${esc(i.title)}.');closeSheet();render();toast('Note saved')">Save</button></div>`); }
function setItemStatus(id, st) { const i = IT(id); i.status = st; logActivity(`${st === 'cancelled' ? 'Cancelled' : 'Updated'} ${i.title}.`); notify('📍', `${i.title} was ${st}.`, ['plan', i.day]); closeSheet(); render(); toast(st === 'cancelled' ? 'Cancelled' : 'Updated', st === 'cancelled' ? 'It stays in history and can be restored' : ''); }
function deleteItem(id) { const i = IT(id); openSheet(h`<h2 class="h2">Delete ${esc(i.title)}?</h2><p class="sub mt8">Linked bookings, votes and expenses are kept. Only the itinerary slot is removed.</p><div class="actions"><button class="btn" onclick="closeSheet()">Keep it</button><button class="btn danger" onclick="S.itinerary=S.itinerary.filter(x=>x.id!=='${id}');logActivity('Deleted ${esc(i.title)} from ${dayLabel(i.day)}.');closeSheet();render();toast('Deleted','${esc(i.title)} removed from the plan')">Delete</button></div>`); }

/* ----- Item detail ----- */
SCREENS.item = ({ id }) => {
  const i = IT(id); if (!i) return SCREENS.plan({});
  const pl = i.placeId ? PL(i.placeId) : null; const bk = i.bookingId ? BK(i.bookingId) : null;
  const dec = S.decisions.find(d => d.confirmedOptionId && d.options.find(o => o.id === d.confirmedOptionId && o.placeId === i.placeId));
  const exps = S.expenses.filter(e => e.itemId === i.id || (i.placeId && e.placeId === i.placeId && e.date === DAY_DATES[i.day - 1]));
  const docs = S.documents.filter(d => d.linked && ((d.linked.type === 'booking' && d.linked.id === i.bookingId) || (d.linked.type === 'item' && d.linked.id === i.id)));
  return h`<div class="screen">${backBtn('Plan')}
    <div class="row top mb16" style="gap:14px"><span style="font-size:44px">${i.emoji}</span><div class="flex1"><h1 class="h1">${esc(i.title)}</h1><p class="sub">${dayLabel(i.day, true)} · ${fmtTime(i.start)}${i.end !== i.start ? ' – ' + fmtTime(i.end) : ''}</p><div class="row mt8 wrap">${statusPill(i)}${bookingPill(i)}${i.costJpy ? `<span class="pill">est. ${fmtHome(i.costJpy)}</span>` : ''}</div></div><button class="iconbtn" onclick="itemMenu('${i.id}')">⋯</button></div>
    <div class="dgrid"><div>
    ${pl ? `<div class="card tap" onclick="go('map',{focus:'${pl.id}'})"><div class="row between"><div><div class="eyebrow mb8">Place</div><b>${pl.emoji} ${esc(pl.name)}</b><div class="tiny">${esc(pl.area)}${pl.rating ? ' · ⭐ ' + pl.rating : ''}${pl.price ? ' · ' + pl.price : ''} · ${pl.fromHotel} min from hotel</div></div><span class="chev">›</span></div>${mapSvg({ focus: pl.id, compact: true, mini: true })}</div>` : ''}
    <div class="card mt12"><div class="eyebrow mb8">Who's going</div><div class="row wrap">${i.people.map(p => `<span class="pill" style="padding-left:3px">${av(p, 'sm')} ${P(p).name}</span>`).join('')}</div>${i.travelMin ? `<div class="divider"></div><div class="tiny">🚇 ${i.travelMin} min travel from the previous stop</div>` : ''}${i.note ? `<div class="divider"></div><div class="tiny">📝 ${esc(i.note)}</div>` : ''}</div>
    </div><div>
    <div class="card"><div class="eyebrow mb8">Connected to this plan</div>
      <div class="list" style="box-shadow:none;background:transparent">
        ${bk ? `<button class="item tap" style="padding-left:0;padding-right:0" onclick="go('booking',{id:'${bk.id}'})"><span class="ic">🎟</span><div class="body"><div class="title">${esc(bk.title)}</div><div class="meta">Ref ${bk.ref} · ${bk.status}</div></div><span class="chev">›</span></button>` : i.booking === 'needed' ? `<div class="item" style="padding-left:0;padding-right:0"><span class="ic">🎟</span><div class="body"><div class="title" style="color:var(--bad)">Booking missing</div><div class="meta">Drop a confirmation into Trip Inbox</div></div><button class="btn xs primary" onclick="resolveIssue('booking','${i.id}')">Resolve</button></div>` : ''}
        ${dec ? `<button class="item tap" style="padding-left:0;padding-right:0" onclick="go('decision',{id:'${dec.id}'})"><span class="ic">🗳</span><div class="body"><div class="title">${esc(dec.title)}</div><div class="meta">Confirmed by the group</div></div><span class="chev">›</span></button>` : ''}
        ${exps.map(e => `<button class="item tap" style="padding-left:0;padding-right:0" onclick="go('expense',{id:'${e.id}'})"><span class="ic">💰</span><div class="body"><div class="title">${fmtJpy(e.jpy)} · ${esc(e.merchant)}</div><div class="meta">Paid by ${P(e.payer).name} · ${e.participants.length} people</div></div><span class="chev">›</span></button>`).join('')}
        ${docs.map(d => `<button class="item tap" style="padding-left:0;padding-right:0" onclick="go('documents')"><span class="ic">📄</span><div class="body"><div class="title">${esc(d.name)}</div><div class="meta">${d.category}</div></div><span class="chev">›</span></button>`).join('')}
        ${!bk && i.booking !== 'needed' && !dec && !exps.length && !docs.length ? '<p class="tiny" style="padding:8px 0">Nothing linked yet. Bookings, receipts and votes will show up here.</p>' : ''}
      </div></div>
    <div class="actions"><button class="btn" onclick="go('scan',{itemId:'${i.id}'})">🧾 Add receipt</button><button class="btn" onclick="go('map',{focus:'${pl ? pl.id : 'hilton'}'})">🗺 Map</button></div>
    </div></div></div>`;
};

/* ----- Add / edit activity ----- */
SCREENS['activity-add'] = ({ day, edit, placeId }) => {
  const i = edit ? IT(edit) : { title: placeId ? PL(placeId).name : '', day: day || planDay, start: '18:00', end: '19:30', placeId: placeId || '', people: S.people.map(p => p.id), costJpy: '', status: 'proposed', note: '' };
  return h`<div class="screen" style="max-width:560px">${backBtn()}
    <h1 class="h1 mb16">${edit ? 'Edit activity' : 'Add activity'}</h1>
    <div class="stack">
      <div class="field"><label>Activity name</label><input class="input" id="a-title" value="${esc(i.title)}" placeholder="e.g. Ramen dinner"></div>
      <div class="grid3"><div class="field"><label>Date</label><select class="input" id="a-day">${DAY_DATES.map((d, k) => `<option value="${k + 1}" ${i.day === k + 1 ? 'selected' : ''}>${dayLabel(k + 1)}</option>`).join('')}</select></div><div class="field"><label>Start</label><input class="input" type="time" id="a-start" value="${i.start}"></div><div class="field"><label>End</label><input class="input" type="time" id="a-end" value="${i.end}"></div></div>
      <div class="field"><label>Location</label><select class="input" id="a-place"><option value="">Choose a place</option>${S.places.map(p => `<option value="${p.id}" ${i.placeId === p.id ? 'selected' : ''}>${p.emoji} ${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>People</label><div class="row wrap" id="a-people">${S.people.map(p => `<button class="check ${i.people.includes(p.id) ? 'on' : ''}" data-id="${p.id}" style="padding:6px 10px 6px 6px" onclick="this.classList.toggle('on')"><span class="box">✓</span>${av(p.id, 'sm')} ${p.name}</button>`).join('')}</div></div>
      <div class="grid2"><div class="field"><label>Cost (JPY, whole group)</label><input class="input" id="a-cost" type="number" value="${i.costJpy || ''}" placeholder="0"></div><div class="field"><label>Status</label><select class="input" id="a-status">${['idea', 'proposed', 'voting', 'confirmed', 'cancelled', 'completed'].map(s => `<option value="${s}" ${i.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></div></div>
      <div class="field"><label>Notes</label><textarea class="input" id="a-note" placeholder="Anything the group should know">${esc(i.note || '')}</textarea></div>
      <div class="grid2"><button class="btn outline" onclick="toast('Booking can be attached after saving','Use Add booking from the item menu')">🎟 Booking</button><button class="btn outline" onclick="toast('Attachments go through Trip Inbox')">📎 Attachments</button></div>
      <button class="btn primary lg block" onclick="saveActivity('${edit || ''}')">${edit ? 'Save changes' : 'Add to trip'}</button>
    </div></div>`;
};
function saveActivity(edit) {
  const title = $('#a-title').value.trim(); if (!title) { toast('Give the activity a name'); return; }
  const people = [...document.querySelectorAll('#a-people .check.on')].map(b => b.dataset.id);
  const data = { title, day: Number($('#a-day').value), start: $('#a-start').value, end: $('#a-end').value, placeId: $('#a-place').value || null, people, costJpy: Number($('#a-cost').value) || null, status: $('#a-status').value, note: $('#a-note').value };
  const pl = data.placeId ? PL(data.placeId) : null;
  if (edit) { const i = IT(edit); const old = i.start; Object.assign(i, data); logActivity(old !== i.start ? `Changed ${i.title} from ${fmtTime(old)} to ${fmtTime(i.start)}.` : `Edited ${i.title}.`); notify('📍', `Jennie updated ${i.title}.`, ['item', i.id]); go('item', { id: edit }, { replace: true }); toast('Saved', 'Everyone sees the change'); return; }
  const i = Object.assign({ id: uid('i'), emoji: pl ? pl.emoji : '📍', category: pl ? (pl.type === 'restaurant' ? 'food' : pl.type) : 'activity', booking: 'none', travelMin: pl ? Math.max(5, Math.round(pl.fromHotel * .7)) : 10 }, data);
  S.itinerary.push(i); logActivity(`Added ${title} to ${dayLabel(i.day)}.`); notify('📍', `Jennie added ${title} to ${dayLabel(i.day)}.`, ['item', i.id]);
  planDay = i.day; go('plan', { day: i.day }, { replace: true }); toast('Added to trip', `${title} · ${dayLabel(i.day)} ${fmtTime(i.start)}${pl ? ' · now on the map' : ''}`);
}

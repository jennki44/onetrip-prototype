/* OneTRIP prototype — part 2: map, decisions, money, receipts, inbox, Trip Brain, health, travel mode, more. */

/* ----- Map ----- */
let mapFilter = 'all', mapSel = null;
const TYPE_LABEL = { hotel: 'Hotel', restaurant: 'Food', activity: 'Activity', transport: 'Transport', shopping: 'Shopping', saved: 'Saved' };
function mapPlaces(opts) {
  let ids;
  if (opts.day) ids = itemsOnDay(opts.day).map(i => i.placeId).filter(Boolean);
  else if (mapFilter === 'today') ids = todayItems().map(i => i.placeId);
  else if (mapFilter === 'food') ids = S.places.filter(p => p.type === 'restaurant').map(p => p.id);
  else if (mapFilter === 'activities') ids = S.places.filter(p => p.type === 'activity').map(p => p.id);
  else if (mapFilter === 'bookings') ids = S.itinerary.filter(i => i.booking === 'booked' && i.placeId).map(i => i.placeId);
  else if (mapFilter === 'saved') ids = S.places.filter(p => p.saved).map(p => p.id);
  else ids = S.places.map(p => p.id);
  return [...new Set(ids)].map(PL).filter(Boolean);
}
function mapSvg(opts) {
  opts = opts || {}; const places = opts.focus ? [PL(opts.focus)] : mapPlaces(opts);
  const routeIds = (opts.day ? itemsOnDay(opts.day) : (mapFilter === 'today' ? todayItems() : [])).map(i => i.placeId).filter(Boolean);
  const routePts = routeIds.map(PL).filter(p => p && p.x < 360 && p.y < 460);
  const focus = opts.focus ? PL(opts.focus) : null;
  const vb = opts.mini && focus ? `${focus.x - 80} ${focus.y - 50} 160 100` : '0 0 400 520';
  const showLabels = !opts.mini;
  const colorOf = p => p.type === 'restaurant' ? 'var(--spark)' : p.type === 'hotel' ? 'var(--ink)' : p.type === 'transport' ? '#2457C5' : p.type === 'shopping' ? '#BE185D' : 'var(--accent)';
  return h`<div class="mapwrap"><svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of trip places in Tokyo" ${opts.compact ? 'style="max-height:420px"' : ''}>
    <rect x="-100" y="-100" width="700" height="800" fill="var(--map-land)"/>
    <path d="M 230 520 C 250 470, 340 470, 400 500 L 400 520 Z" fill="var(--map-water)"/>
    <path d="M 220 0 C 226 120, 200 200, 240 300 C 260 350, 300 420, 320 520 L 300 520 C 280 430, 240 360, 222 300 C 190 200, 212 120, 206 0 Z" fill="var(--map-water)"/>
    <path d="M 340 0 C 350 100, 330 160, 350 260 C 360 320, 400 400, 400 520 L 380 520 C 380 400, 340 320, 332 260 C 316 160, 336 100, 326 0 Z" fill="var(--map-water)" opacity=".8"/>
    <rect x="86" y="222" width="70" height="52" rx="16" fill="var(--map-park)"/>
    <rect x="228" y="228" width="44" height="34" rx="12" fill="var(--map-park)"/>
    <rect x="96" y="150" width="60" height="30" rx="10" fill="var(--map-park)"/>
    <g stroke="var(--map-road)" stroke-width="5" fill="none" stroke-linecap="round">
      <path d="M 118 20 L 118 500"/><path d="M 0 300 L 300 300 L 380 260"/><path d="M 20 190 L 320 190 L 380 120"/><path d="M 118 300 C 180 400, 260 400, 302 404"/><path d="M 130 240 L 264 262 L 282 206"/><path d="M 262 262 L 264 296 L 282 318"/>
    </g>
    <g stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-dasharray="1 6" stroke-linecap="round" opacity=".7"><circle cx="200" cy="260" r="110"/></g>
    ${showLabels ? `<g class="lbl"><text x="80" y="140" class="lbl">Shinjuku</text><text x="96" y="345" class="lbl">Shibuya</text><text x="240" y="335" class="lbl">Ginza</text><text x="300" y="120" class="lbl">Asakusa</text><text x="262" y="440" class="lbl">Toyosu</text><text x="330" y="470" class="lbl">Maihama</text></g>` : ''}
    ${routePts.length > 1 ? `<polyline points="${routePts.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${places.map(p => { const sel = mapSel === p.id || (focus && focus.id === p.id); const r = opts.mini ? 11 : 12; return `<g class="pin ${sel ? 'sel' : ''}" transform="translate(${p.x} ${p.y})" onclick="${opts.mini || opts.compact ? `go('map',{focus:'${p.id}'})` : `selectPlace('${p.id}')`}"><circle class="halo" r="${r + 10}"/><circle r="${r}" fill="var(--surface)" stroke="${colorOf(p)}" stroke-width="${sel ? 4 : 3}"/><text y="4" text-anchor="middle" style="font-size:${r}px;stroke:none">${p.emoji}</text>${showLabels ? `<text y="${r + 11}" text-anchor="middle">${esc(p.name.split(' · ')[0])}</text>` : ''}</g>`; }).join('')}
    ${!opts.mini ? `<g transform="translate(128 240)"><circle r="18" fill="#2457C5" opacity=".18"><animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite"/></circle><circle r="5" fill="#2457C5" stroke="#fff" stroke-width="2"/></g>` : ''}
  </svg>${opts.mini ? '' : `<div class="legend"><span>📍 You · Meiji Shrine</span>${routePts.length > 1 ? '<span>— Today’s route</span>' : ''}</div>`}</div>`;
}
SCREENS.map = ({ focus }) => {
  if (focus) { mapSel = focus; }
  const filters = [['all', 'All'], ['today', 'Today'], ['food', 'Food'], ['activities', 'Activities'], ['bookings', 'Bookings'], ['saved', 'Saved']];
  const p = mapSel ? PL(mapSel) : null;
  return h`<div class="screen wide">
    ${pageHead('Map', 'Every place in the trip — hotel, food, activities, bookings and saved ideas.')}
    <div class="chips mb12">${filters.map(([k, l]) => `<button class="chip ${mapFilter === k ? 'on' : ''}" onclick="mapFilter='${k}';mapSel=null;render()">${l}</button>`).join('')}</div>
    <div class="${isDesktop() ? 'dgrid' : ''}"><div>${mapSvg({})}</div>
    <div>${p ? placePanel(p) : `<div class="list mt12">${mapPlaces({}).map(x => `<button class="item tap" onclick="selectPlace('${x.id}')"><span class="ic">${x.emoji}</span><div class="body"><div class="title">${esc(x.name)}</div><div class="meta">${TYPE_LABEL[x.type]} · ${esc(x.area)}${x.rating ? ' · ⭐ ' + x.rating : ''}</div></div><span class="tiny">${x.fromHotel} min</span></button>`).join('')}</div>`}</div></div>
  </div>`;
};
SCREENS.map.after = ({ focus }) => { if (focus && !isDesktop()) { selectPlace(focus); route.p = {}; } };
function placeLinks(p) {
  const items = S.itinerary.filter(i => i.placeId === p.id && i.status !== 'cancelled');
  const decs = S.decisions.filter(d => d.options.some(o => o.placeId === p.id));
  const exps = S.expenses.filter(e => e.placeId === p.id);
  const bks = S.bookings.filter(b => items.some(i => i.bookingId === b.id));
  return { items, decs, exps, bks };
}
function placePanel(p) {
  const L = placeLinks(p);
  return h`<div class="card mt12">
    <div class="row top between"><div><div class="h2">${p.emoji} ${esc(p.name)}</div><div class="sub">${p.rating ? '⭐ ' + p.rating + ' · ' : ''}${p.fromHotel} min from hotel${p.price ? ' · ' + p.price : ''}</div></div><button class="iconbtn plain" onclick="mapSel=null;render()">✕</button></div>
    ${p.hours ? `<div class="tiny mt8">Open ${p.hours}</div>` : ''}
    ${placeConnections(p, L)}
    <div class="grid2 mt12"><button class="btn primary" onclick="suggestPlace('${p.id}')">🗳 Suggest to group</button><button class="btn" onclick="go('activity-add',{placeId:'${p.id}'})">📅 Add to itinerary</button><button class="btn" onclick="bookPlace('${p.id}')">🎟 Book</button><button class="btn ${p.saved ? 'outline' : ''}" onclick="savePlace('${p.id}')">${p.saved ? '💚 Saved' : '🤍 Save'}</button></div></div>`;
}
function placeConnections(p, L) {
  const chips = [];
  L.items.forEach(i => chips.push(`<button onclick="go('item',{id:'${i.id}'})">📅 ${dayLabel(i.day)} ${fmtTime(i.start)}</button>`));
  L.decs.forEach(d => chips.push(`<button onclick="go('decision',{id:'${d.id}'})">🗳 ${esc(d.title)}${d.confirmedOptionId && d.options.find(o => o.id === d.confirmedOptionId).placeId === p.id ? ' ✓' : ''}</button>`));
  L.bks.forEach(b => chips.push(`<button onclick="go('booking',{id:'${b.id}'})">🎟 Booked</button>`));
  L.exps.forEach(e => chips.push(`<button onclick="go('expense',{id:'${e.id}'})">💰 ${fmtJpy(e.jpy)}</button>`));
  if (p.saved) chips.push('<button>💚 Saved</button>');
  return chips.length ? `<div class="mt12"><div class="eyebrow mb8">In this trip</div><div class="linked">${chips.join('')}</div></div>` : '<p class="tiny mt8">Not in the plan yet.</p>';
}
function selectPlace(id) {
  mapSel = id;
  if (isDesktop()) { render(); return; }
  const p = PL(id); const L = placeLinks(p);
  render();
  openSheet(h`<div class="row top between"><div><div class="h2">${p.emoji} ${esc(p.name)}</div><div class="sub">${p.rating ? '⭐ ' + p.rating + ' · ' : ''}${p.fromHotel} min from hotel${p.price ? ' · ' + p.price : ''}</div></div></div>
    ${p.hours ? `<div class="tiny mt8">Open ${p.hours}</div>` : ''}${placeConnections(p, L)}
    <div class="grid2 mt16"><button class="btn primary" onclick="closeSheet();suggestPlace('${p.id}')">🗳 Suggest to group</button><button class="btn" onclick="closeSheet();go('activity-add',{placeId:'${p.id}'})">📅 Add to itinerary</button><button class="btn" onclick="closeSheet();bookPlace('${p.id}')">🎟 Book</button><button class="btn" onclick="savePlace('${p.id}')">${p.saved ? '💚 Saved' : '🤍 Save'}</button></div>`);
}
function savePlace(id) { const p = PL(id); p.saved = !p.saved; if (p.saved) { logActivity('Saved ' + p.name + ' as a place.'); toast('Saved', p.name + ' is now in Saved places'); } closeSheet(); render(); if (!isDesktop() && p.saved) selectPlace(id); }
function suggestPlace(id) {
  const p = PL(id); const open = S.decisions.filter(d => d.status !== 'confirmed' && d.category === 'Food');
  openSheet(h`<h2 class="h2">Suggest ${esc(p.name)}</h2><p class="sub mb12">Add it as an option to an open decision, or start a new one.</p>
    <div class="menu">${open.map(d => `<button onclick="addOption('${d.id}','${id}')"><span class="ic">🗳</span><div><div>${esc(d.title)}</div><div class="tiny">${d.options.length} options · ${votersOf(d).size} voted</div></div></button>`).join('')}
    <button onclick="newDecisionSheet('${id}')"><span class="ic">➕</span>Start a new decision</button></div>`);
}
function addOption(did, pid) {
  const d = DEC(did); if (d.options.some(o => o.placeId === pid)) { closeSheet(); toast('Already an option', PL(pid).name + ' is in ' + d.title); go('decision', { id: did }); return; }
  const o = { id: uid('o'), placeId: pid, estPP: PL(pid).estPP || 4000 }; d.options.push(o); d.votes[o.id] = {};
  logActivity(`Suggested ${PL(pid).name} for ${d.title}.`); notify('🗳', `Jennie suggested ${PL(pid).name} for ${d.title}.`, ['decision', did]);
  closeSheet(); go('decision', { id: did }); toast('Suggested to the group', 'Everyone can vote on it now');
}
function bookPlace(id) {
  const p = PL(id);
  openSheet(h`<h2 class="h2">Book ${esc(p.name)}</h2><p class="sub mb12">OneTRIP doesn't take payments. Book with the venue, then drop the confirmation here and it links itself to the plan.</p>
    <div class="card soft mb12"><div class="row between"><span>📞 Call venue</span><span class="tiny">+81 3 5555 0142</span></div><div class="divider"></div><div class="row between"><span>🌐 Reserve online</span><span class="tiny">Opens partner site</span></div></div>
    <div class="actions"><button class="btn" onclick="closeSheet()">Later</button><button class="btn primary" onclick="closeSheet();go('inbox',{auto:'pdf'})">I have a confirmation</button></div>`);
}

/* ----- Decisions ----- */
SCREENS.decisions = () => {
  const open = S.decisions.filter(d => d.status !== 'confirmed'), done = S.decisions.filter(d => d.status === 'confirmed');
  return h`<div class="screen">${pageHead('Group decisions', 'Things your group still needs to decide.', `<button class="btn sm primary" onclick="newDecisionSheet()">+ New</button>`)}
    ${open.length ? `<div class="${isDesktop() ? 'dsplit' : 'stack'}">${open.map(d => decisionCardFull(d)).join('')}</div>` : `<div class="empty"><div class="e">🗳️</div><div class="h3">Nothing to decide yet.</div><p>Save a restaurant or activity and ask your group to vote.</p><button class="btn primary mt12" onclick="go('map')">Find something</button></div>`}
    ${done.length ? `<div class="section"><div class="eyebrow">Decided</div><div class="list">${done.map(d => `<button class="item tap" onclick="go('decision',{id:'${d.id}'})"><span class="ic">✅</span><div class="body"><div class="title">${esc(d.title)}</div><div class="meta">${esc(optionName(d.options.find(o => o.id === d.confirmedOptionId)))} · added to ${dayLabel(d.day)} ${fmtTime(d.slot)}</div></div><span class="chev">›</span></button>`).join('')}</div></div>` : ''}
  </div>`;
};
function decisionCardFull(d) {
  const st = decisionStatus(d); const n = votersOf(d).size; const lead = leadingOption(d); const myVote = Object.values(d.votes).some(v => v[S.me]);
  const dl = new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const cheapest = Math.min(...d.options.map(o => o.estPP));
  return h`<div class="card tap" onclick="go('decision',{id:'${d.id}'})">
    <div class="row between top"><div><div class="h3">${esc(d.title)}</div><div class="tiny">${esc(d.question)}</div></div><span class="pill ${st.tone}">${st.label}</span></div>
    <div class="row mt12"><div class="bar flex1"><i style="width:${n / S.people.length * 100}%"></i></div><span class="tiny num" style="font-weight:700">${n} / ${S.people.length} voted</span></div>
    <div class="mt12">${d.options.map(o => `<div class="row between tiny" style="padding:4px 0"><span>${o === lead ? '<b>' + esc(optionName(o)) + '</b>' : esc(optionName(o))}</span><span class="reactrow" style="font-size:12px">${Object.entries(optionCounts(d, o.id)).filter(([k, v]) => v).map(([k, v]) => REACT[k].e + ' ' + v).join(' ')}</span></div>`).join('')}</div>
    <div class="divider"></div>
    <div class="row between tiny"><span>⏳ Closes ${dl}</span><span>💰 ${fmtHome(cheapest)}–${fmtHome(Math.max(...d.options.map(o => o.estPP)))}/person</span>${!myVote ? '<span class="pill spark">Needs your vote</span>' : '<span class="pill good">You voted</span>'}</div></div>`;
}
SCREENS.decision = ({ id }) => {
  const d = DEC(id); if (!d) return SCREENS.decisions();
  const st = decisionStatus(d); const n = votersOf(d).size; const lead = leadingOption(d);
  const sorted = [...d.options].sort((a, b) => optionScore(d, b.id) - optionScore(d, a.id));
  const second = sorted[1];
  const confirmed = d.status === 'confirmed';
  const opt = o => { const p = o.placeId ? PL(o.placeId) : null; const c = optionCounts(d, o.id); const mine = (d.votes[o.id] || {})[S.me]; const isLead = o === lead && !confirmed; const isConf = confirmed && d.confirmedOptionId === o.id;
    return h`<div class="card ${isConf ? 'accent' : ''}" style="${isLead ? 'outline:2px solid var(--accent)' : ''}">
      <div class="row top between"><div class="row" style="gap:12px"><span style="font-size:28px">${p ? p.emoji : '🗳'}</span><div><div class="h3">${esc(optionName(o))}</div><div class="tiny">${p ? `${p.price} · ${p.rating} ⭐ · ${p.fromHotel} min away` : esc(o.sub || '')}</div><div class="tiny">Estimated <b>${fmtHome(o.estPP)}/person</b> · ${fmtJpy(o.estPP)}</div></div></div>${isConf ? '<span class="pill good">Confirmed</span>' : isLead ? '<span class="pill accent">Leading</span>' : ''}</div>
      <div class="reactrow mt12">${Object.entries(c).map(([k, v]) => `<span title="${Object.entries(d.votes[o.id] || {}).filter(([, r]) => r === k).map(([pid]) => P(pid).name).join(', ')}">${REACT[k].e} ${v}</span>`).join('')}<span style="margin-left:auto">${avs(Object.keys(d.votes[o.id] || {}), 5)}</span></div>
      ${confirmed ? '' : `<div class="votes mt12">${Object.entries(REACT).map(([k, r]) => `<button class="vote ${mine === k ? 'on' : ''}" onclick="vote('${d.id}','${o.id}','${k}')">${r.e}<small>${r.label}</small></button>`).join('')}</div>`}
    </div>`; };
  const brain = confirmed ? '' : lead ? h`<div class="brainbox mt16">
      <div class="eyebrow mb8">✨ Trip Brain recommendation</div>
      <div class="h3 mb8">${esc(optionName(lead))} is currently the strongest group choice.</div>
      <div class="tiny" style="font-weight:700;color:var(--text-2)">Why</div>
      <ul class="why" style="margin:4px 0 0;padding-left:18px;font-size:14px;color:var(--text-2)">
        <li>${optionCounts(d, lead.id).love + optionCounts(d, lead.id).good} of ${S.people.length} people like it (${optionCounts(d, lead.id).love} love, ${optionCounts(d, lead.id).good} good)</li>
        ${lead.placeId ? `<li>${PL(lead.placeId).rating >= Math.max(...d.options.filter(o => o.placeId).map(o => PL(o.placeId).rating)) ? 'Highest rating of the options' : 'Rated ' + PL(lead.placeId).rating + ' ⭐'} · ${PL(lead.placeId).fromHotel} min from the hotel</li>` : ''}
        <li>${budgetLine(d, lead)}</li>
      </ul>
      ${second ? `<p class="tiny mt8">It costs approximately <b>${fmtHome(Math.abs(lead.estPP - second.estPP))} ${lead.estPP >= second.estPP ? 'more' : 'less'} per person</b> than ${esc(optionName(second))}.</p>` : ''}
      <p class="tiny mt8" style="color:var(--text-3)">Assumes ${S.people.length} people and today's rate of 1 ${S.reporting} = ${RATES[S.reporting]} JPY. Nothing changes until you confirm.</p>
      <div class="actions"><button class="btn primary" onclick="confirmDecision('${d.id}','${lead.id}')">Confirm ${esc(optionName(lead))}</button><button class="btn" onclick="toast('Keeping it open','Voting closes ' + '${new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long' })}')">Keep voting</button></div>
    </div>` : '';
  return h`<div class="screen">${backBtn('Decisions')}
    <div class="hdr"><div><h1 class="h1">${esc(d.title)}</h1><p class="sub">${esc(d.question)}</p></div><span class="pill ${st.tone}">${st.label}</span></div>
    <div class="row mb16"><div class="bar flex1"><i class="${confirmed ? 'good' : ''}" style="width:${n / S.people.length * 100}%"></i></div><span class="tiny num" style="font-weight:700">${n} / ${S.people.length} voted</span><span class="tiny">· ${S.people.filter(p => !votersOf(d).has(p.id)).map(p => p.name).join(', ') || 'everyone'} ${votersOf(d).size === S.people.length ? 'voted' : 'still to vote'}</span></div>
    ${confirmed ? `<div class="goodbox mb16">✅<span><b>${esc(optionName(d.options.find(o => o.id === d.confirmedOptionId)))}</b> confirmed. Added to ${dayLabel(d.day)} at ${fmtTime(d.slot)}. <button class="link" onclick="go('plan',{day:${d.day}})">See plan ›</button></span></div>` : ''}
    <div class="dgrid"><div class="stack">${sorted.map(opt).join('')}${!confirmed ? `<button class="btn outline" onclick="go('map')">+ Suggest another option from the map</button>` : ''}</div><div>${brain}</div></div>
  </div>`;
};
function budgetLine(d, o) {
  const cat = d.category; const spent = spentByCategory()[cat] || 0; const bud = catBudgetJpy(cat); const cost = o.estPP * S.people.length;
  return spent + cost <= bud ? `Within the planned ${cat.toLowerCase()} budget (${fmtHome(bud - spent)} left before this)` : `Would take ${cat.toLowerCase()} about ${fmtHome(spent + cost - bud)} over its budget`;
}
function vote(did, oid, r) {
  const d = DEC(did); d.votes[oid] = d.votes[oid] || {}; const was = d.votes[oid][S.me];
  if (was === r) delete d.votes[oid][S.me]; else d.votes[oid][S.me] = r;
  const o = d.options.find(x => x.id === oid);
  if (was !== r) { logActivity(`Voted ${REACT[r].e} for ${optionName(o)} in ${d.title}.`); }
  if (d.status !== 'confirmed') d.status = votersOf(d).size >= 4 ? 'almost' : 'open';
  render(); if (was !== r) toast(`${REACT[r].e} ${optionName(o)}`, 'Your vote is visible to the group');
}
function confirmDecision(did, oid) {
  const d = DEC(did); const o = d.options.find(x => x.id === oid); const p = o.placeId ? PL(o.placeId) : null;
  loadingSheet('Checking your itinerary…', 900, () => {
    d.status = 'confirmed'; d.confirmedOptionId = oid;
    let item = S.itinerary.find(i => i.decisionId === did);
    if (!item) {
      item = { id: uid('i'), day: d.day, start: d.slot, end: toHM(minutes(d.slot) + 90), title: d.title.includes('dinner') ? 'Dinner' : d.title, placeId: p ? p.id : (d.id === 'dec_transfer' ? 'narita' : 'fuji'), emoji: p ? p.emoji : '✅', category: d.category === 'Food' ? 'food' : d.category === 'Transport' ? 'transport' : 'activity', status: 'confirmed', booking: d.category === 'Food' ? 'none' : 'needed', travelMin: p ? p.fromHotel : 10, costJpy: o.estPP * S.people.length, people: S.people.map(x => x.id), decisionId: did, note: 'Confirmed from the ' + d.title + ' decision' };
      // Special: transfer & fuji decisions resolve existing itinerary slots instead of adding a new one
      if (did === 'dec_transfer') { const t = IT('i33'); t.status = 'confirmed'; t.title = 'Airport transfer · ' + optionName(o); t.costJpy = o.estPP * S.people.length; t.decisionId = did; item = t; }
      else if (did === 'dec_fuji') { const t = IT('i20'); t.title = 'Mount Fuji day trip · ' + optionName(o); t.costJpy = o.estPP * S.people.length; t.decisionId = did; item = t; }
      else S.itinerary.push(item);
    }
    if (p) p.saved = true;
    logActivity(`Confirmed ${optionName(o)} for ${d.title}.`);
    notify('📍', `${d.title} was added to your itinerary: ${optionName(o)}, ${dayLabel(d.day)} ${fmtTime(d.slot)}.`, ['item', item.id]);
    S.people.filter(x => x.id !== S.me).slice(0, 1).forEach(x => notify('🗳', `${x.name} confirmed ${optionName(o)} too.`, ['decision', did]));
    closeSheet(); render();
    toast(`Added to ${dayWeekday(d.day)} at ${fmtTime(d.slot)}.`, `${optionName(o)} is now on the plan, the map and the budget`, { label: 'View', fn: () => go('item', { id: item.id }) });
  });
}

/* ----- Money ----- */
let moneyTab = 'overview', expFilter = { person: '', category: '', date: '', currency: '', participant: '' };
SCREENS.money = ({ tab }) => {
  if (tab) moneyTab = tab;
  const body = moneyTab === 'overview' ? moneyOverview() : moneyTab === 'expenses' ? moneyExpenses() : moneyBalances();
  return h`<div class="screen">${pageHead('Money', `Reporting in ${S.reporting} · 1 ${S.reporting === 'JPY' ? 'AUD' : S.reporting} = ${S.reporting === 'JPY' ? RATES.AUD : RATES[S.reporting]} JPY`, `<div class="row"><select class="input" style="width:auto;padding:6px 10px;font-weight:700;font-size:13px" onchange="S.reporting=this.value;render()">${Object.keys(RATES).map(c => `<option ${S.reporting === c ? 'selected' : ''}>${c}</option>`).join('')}</select><button class="btn sm primary" onclick="go('expense-add')">+ Expense</button></div>`)}
    <div class="tabs mb16"><button class="${moneyTab === 'overview' ? 'on' : ''}" onclick="go('money',{tab:'overview'},{replace:true})">Overview</button><button class="${moneyTab === 'expenses' ? 'on' : ''}" onclick="go('money',{tab:'expenses'},{replace:true})">Expenses</button><button class="${moneyTab === 'balances' ? 'on' : ''}" onclick="go('money',{tab:'balances'},{replace:true})">Balances</button></div>
    ${body}</div>`;
};
function moneyOverview() {
  const spent = spentJpy(), bud = budgetJpy(), fc = forecastJpy(); const cats = spentByCategory();
  const parts = Object.keys(S.budget.categories).map(c => ({ c, v: cats[c] || 0, color: CAT_COLORS[c] }));
  const byDay = DAY_DATES.map(d => S.expenses.filter(e => e.date === d).reduce((a, e) => a + e.jpy, 0));
  const mx = Math.max(...byDay, 1);
  const spark = `<svg class="spark" viewBox="0 0 300 56" preserveAspectRatio="none">${byDay.map((v, i) => `<rect x="${i * 33 + 4}" y="${56 - v / mx * 50}" width="26" height="${v / mx * 50}" rx="4" fill="${i + 1 === TODAY_DAY ? 'var(--spark)' : i + 1 < TODAY_DAY ? 'var(--accent)' : 'var(--line)'}"/>`).join('')}</svg>`;
  return h`<div class="dgrid"><div>
    <div class="kpis">
      <div class="kpi"><div class="eyebrow">Trip budget</div><div class="v">${fmtHome(bud, { dec: 0 })}</div><div class="s">${S.people.length} travellers</div></div>
      <div class="kpi"><div class="eyebrow">Spent</div><div class="v">${fmtHome(spent, { dec: 0 })}</div><div class="s">${fmtJpy(spent)} · ${Math.round(spent / bud * 100)}%</div></div>
      <div class="kpi"><div class="eyebrow">Remaining</div><div class="v" style="color:var(--good)">${fmtHome(bud - spent, { dec: 0 })}</div><div class="s">${9 - TODAY_DAY + 1} days left</div></div>
      <div class="kpi"><div class="eyebrow">Forecast</div><div class="v" style="color:${fc > bud ? 'var(--warn)' : 'var(--ink)'}">${fmtHome(fc, { dec: 0 })}</div><div class="s">${fc > bud ? fmtHome(fc - bud, { dec: 0 }) + ' over' : fmtHome(bud - fc, { dec: 0 }) + ' under'}</div></div>
    </div>
    ${fc > bud ? `<div class="warnbox mt12">⚠️<span>You may finish about <b>${fmtHome(fc - bud, { dec: 0 })}</b> over budget. Forecast = paid expenses + hotel balance + booked-but-unpaid plans + the leading dinner option.</span></div>` : ''}
    <div class="card mt12"><div class="row between mb8"><span class="eyebrow">Spending by day</span><span class="tiny">Today in orange</span></div>${spark}<div class="row between tiny mt8"><span>12 Oct</span><span>20 Oct</span></div></div>
    </div><div>
    <div class="card"><div class="eyebrow mb12">By category</div><div class="row" style="gap:16px">${donut(parts, spent)}<div class="legendlist">${parts.map(p => `<div class="lr"><span class="sw" style="background:${p.color}"></span>${p.c}<span class="amt">${fmtHome(p.v, { dec: 0 })}</span></div>`).join('')}</div></div>
      <div class="catbars mt16">${parts.map(p => { const b = catBudgetJpy(p.c); const pct = b ? p.v / b * 100 : 0; return `<div class="cb"><div class="row between"><span>${FOOD_EMOJI[p.c]} ${p.c}</span><span class="tiny num"><b>${fmtHome(p.v, { dec: 0 })}</b> / ${fmtHome(b, { dec: 0 })}</span></div><div class="bar"><i class="${pct > 100 ? 'bad' : pct > 80 ? 'warn' : ''}" style="width:${Math.min(100, pct)}%"></i></div></div>`; }).join('')}</div></div>
    </div></div>`;
}
function expenseGroups(list) {
  const g = {}; list.forEach(e => { const k = e.date === DAY_DATES[TODAY_DAY - 1] ? 'Today' : e.date === DAY_DATES[TODAY_DAY - 2] ? 'Yesterday' : new Date(e.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }); (g[k] = g[k] || []).push(e); });
  return g;
}
function moneyExpenses() {
  let list = [...S.expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const f = expFilter;
  if (f.person) list = list.filter(e => e.payer === f.person); if (f.category) list = list.filter(e => e.category === f.category); if (f.date) list = list.filter(e => e.date === f.date); if (f.currency) list = list.filter(e => e.currency === f.currency); if (f.participant) list = list.filter(e => e.participants.includes(f.participant));
  const groups = expenseGroups(list);
  const sel = (key, label, opts) => `<select class="chip" style="appearance:none" onchange="expFilter.${key}=this.value;render()"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${v}" ${f[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return h`<div class="chips mb12">${sel('person', 'Paid by', S.people.map(p => [p.id, p.name]))}${sel('category', 'Category', Object.keys(S.budget.categories).map(c => [c, c]))}${sel('date', 'Date', DAY_DATES.map((d, i) => [d, dayLabel(i + 1)]))}${sel('currency', 'Currency', [['JPY', 'JPY'], ['AUD', 'AUD']])}${sel('participant', 'Participant', S.people.map(p => [p.id, p.name]))}${Object.values(f).some(Boolean) ? `<button class="chip" onclick="Object.keys(expFilter).forEach(k=>expFilter[k]='');render()">✕ Clear</button>` : ''}</div>
    ${list.length ? Object.entries(groups).map(([k, es]) => `<div class="section" style="margin-top:14px"><div class="eyebrow">${k} <span>${fmtHome(es.reduce((a, e) => a + e.jpy, 0))}</span></div><div class="list">${es.map(expenseRow).join('')}</div></div>`).join('') : `<div class="empty"><div class="e">💴</div><div class="h3">${Object.values(f).some(Boolean) ? 'No expenses match those filters.' : 'No expenses yet.'}</div><p>${Object.values(f).some(Boolean) ? 'Try clearing a filter.' : 'Add your first expense to start tracking group spending.'}</p><button class="btn primary mt12" onclick="go('expense-add')">Add expense</button></div>`}`;
}
function expenseRow(e) { return `<button class="item tap" onclick="go('expense',{id:'${e.id}'})"><span class="ic">${e.emoji || FOOD_EMOJI[e.category]}</span><div class="body"><div class="title">${esc(e.merchant)}</div><div class="meta">Paid by ${P(e.payer).name} · ${plural(e.participants.length, 'person').replace('persons', 'people')}${e.receiptId ? ' · 🧾' : ''}</div></div><div class="end"><div class="money">${fmtJpy(e.jpy)}</div><div class="tiny">≈ ${fmtHome(e.jpy)}</div></div></button>`; }
function moneyBalances() {
  const net = balances(); const plan = settlementPlan(); const outstanding = plan.reduce((a, p) => a + p.jpy, 0);
  return h`<div class="dgrid"><div>
    <div class="eyebrow mb8">Who owes whom</div>
    <div class="list">${S.people.map(p => { const v = net[p.id]; const settled = Math.abs(v) < 50; return `<div class="item">${av(p.id)}<div class="body"><div class="title">${p.name}${p.id === S.me ? ' (you)' : ''}</div><div class="meta">${settled ? 'Settled' : v > 0 ? 'is owed' : 'owes'}</div></div><div class="end"><div class="money" style="color:${settled ? 'var(--text-3)' : v > 0 ? 'var(--good)' : 'var(--bad)'}">${settled ? '✓' : fmtHome(Math.abs(v))}</div>${settled ? '' : `<div class="tiny">${fmtJpy(Math.abs(v))}</div>`}</div></div>`; }).join('')}</div>
    <p class="tiny mt8">Balances come from every expense's split plus ${S.settlements.length} payments already made between travellers.</p>
    </div><div>
    <div class="card"><div class="eyebrow mb8">Settle up</div>${plan.length ? `<div class="h3">${plural(plan.length, 'payment')} clears everything</div><p class="tiny">Total outstanding: <b>${fmtHome(outstanding)}</b></p><button class="btn primary block mt12" onclick="go('settle')">Simplify settlement</button>` : `<div class="h3">Everyone is settled up 🎉</div><p class="tiny">No payments needed right now.</p>`}</div>
    <div class="card mt12"><div class="eyebrow mb8">Payments made</div>${S.settlements.length ? S.settlements.map(s => `<div class="row between tiny" style="padding:6px 0;border-top:1px solid var(--line-2)"><span>${P(s.from).name} → ${P(s.to).name}</span><span class="num"><b>${fmtJpy(s.jpy)}</b> · ${new Date(s.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span></div>`).join('') : '<p class="tiny">None yet.</p>'}</div>
    </div></div>`;
}
SCREENS.settle = () => {
  const plan = settlementPlan(); const outstanding = plan.reduce((a, p) => a + p.jpy, 0);
  return h`<div class="screen" style="max-width:560px">${backBtn('Money')}
    ${pageHead('Settle up', plan.length ? `The minimum number of payments: ${plan.length}.` : 'Nothing outstanding.')}
    ${plan.length ? `<div class="stack">${plan.map((p, k) => `<div class="card"><div class="row" style="gap:12px">${av(p.from, 'lg')}<div class="flex1"><div class="h3">${P(p.from).name} → ${P(p.to).name}</div><div class="tiny">${p.from === S.me ? 'You pay' : p.to === S.me ? 'Pays you' : 'Between travellers'}</div></div>${av(p.to, 'lg')}</div><div class="row between mt12"><div><div class="big">${fmtHome(p.jpy)}</div><div class="tiny">${fmtJpy(p.jpy)} at 1 ${S.reporting} = ${RATES[S.reporting]} JPY</div></div></div><div class="actions"><button class="btn primary" onclick="markPaid(${k})">Mark as paid</button><button class="btn" onclick="toast('Reminder sent to ${P(p.from).name}','A friendly nudge, not a demand')">Remind</button><button class="btn" onclick="settleDetails('${p.from}','${p.to}')">Details</button></div></div>`).join('')}</div>
    <div class="card soft mt16 row between"><span>Total outstanding</span><b class="money">${fmtHome(outstanding)}</b></div>
    <p class="tiny mt12">OneTRIP records who paid whom. Money moves through your own bank, PayID or cash — no card details are stored here.</p>` : `<div class="empty"><div class="e">🎉</div><div class="h3">Everyone is settled up.</div></div>`}
  </div>`;
};
function markPaid(k) {
  const p = settlementPlan()[k]; if (!p) return;
  loadingSheet('Calculating group balances…', 800, () => {
    S.settlements.push({ id: uid('s'), from: p.from, to: p.to, jpy: p.jpy, date: '2025-10-14', note: 'Marked paid in OneTRIP', status: 'paid' });
    logActivity(`Marked ${P(p.from).name} → ${P(p.to).name} ${fmtHome(p.jpy)} as paid.`); notify('💸', `${P(p.from).name} paid ${P(p.to).name} ${fmtHome(p.jpy)}.`, ['money', 'balances']);
    closeSheet(); render(); toast('Marked as paid', `${P(p.from).name} and ${P(p.to).name} are now settled`);
  });
}
function settleDetails(from, to) {
  const rows = S.expenses.filter(e => e.payer === to && e.participants.includes(from)).map(e => `<div class="row between tiny" style="padding:5px 0;border-top:1px solid var(--line-2)"><span>${esc(e.merchant)}</span><span class="num">${fmtJpy(shareOf(e, from))}</span></div>`).join('');
  openSheet(h`<h2 class="h2">What ${P(from).name} owes ${P(to).name} for</h2><p class="sub mb12">${P(from).name}'s share of expenses ${P(to).name} paid, net of anything the other way.</p><div class="card soft">${rows || '<p class="tiny">No direct expenses — this comes from simplifying the group’s debts.</p>'}</div><button class="btn block mt12" onclick="closeSheet()">Close</button>`);
}
SCREENS.expense = ({ id }) => {
  const e = EXP(id); if (!e) return SCREENS.money({});
  const rc = e.receiptId ? S.receipts.find(r => r.id === e.receiptId) : null; const p = e.placeId ? PL(e.placeId) : null;
  const item = e.itemId ? IT(e.itemId) : (p ? S.itinerary.find(i => i.placeId === p.id && DAY_DATES[i.day - 1] === e.date) : null);
  return h`<div class="screen" style="max-width:600px">${backBtn('Expenses')}
    <div class="row top mb16" style="gap:14px"><span class="ic" style="width:52px;height:52px;border-radius:16px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:26px">${e.emoji || FOOD_EMOJI[e.category]}</span><div class="flex1"><h1 class="h1">${esc(e.merchant)}</h1><p class="sub">${new Date(e.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(e.time)} · ${e.category}</p></div></div>
    <div class="card"><div class="big">${fmtJpy(e.jpy)} <span class="tiny">JPY</span></div><div class="sub">approximately <b>${fmtHome(e.jpy)}</b></div><div class="tiny mt8">Exchange rate: 1 ${S.reporting === 'JPY' ? 'AUD' : S.reporting} = ${S.reporting === 'JPY' ? RATES.AUD : RATES[S.reporting]} JPY · original amount is always kept</div>
      <div class="divider"></div><div class="row"><span class="tiny">Paid by</span>${av(e.payer, 'sm')}<b>${P(e.payer).name}</b><span class="tiny" style="margin-left:auto">Split: ${e.split}</span></div></div>
    <div class="card mt12"><div class="eyebrow mb8">Each person's share</div>${e.participants.map(pid => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line-2)"><span class="row">${av(pid, 'sm')} ${P(pid).name}</span><span class="num"><b>${fmtJpy(shareOf(e, pid))}</b> <span class="tiny">≈ ${fmtHome(shareOf(e, pid))}</span></span></div>`).join('')}</div>
    ${rc ? `<div class="card mt12"><div class="eyebrow mb8">🧾 Receipt items</div>${rc.items.map(it => `<div class="row between tiny" style="padding:5px 0;border-top:1px solid var(--line-2)"><span>${esc(it.name)} <span style="color:var(--text-3)">· ${it.who.map(w => P(w).name).join(', ')}</span></span><span class="num">${fmtJpy(it.jpy)}</span></div>`).join('')}<div class="row between tiny" style="padding:5px 0;border-top:1px solid var(--line-2)"><span>Tax</span><span class="num">${fmtJpy(rc.tax)}</span></div></div>` : ''}
    <div class="card mt12"><div class="eyebrow mb8">Connected</div><div class="linked">${p ? `<button onclick="go('map',{focus:'${p.id}'})">📍 ${esc(p.name)}</button>` : ''}${item ? `<button onclick="go('item',{id:'${item.id}'})">📅 ${esc(item.title)} · ${dayLabel(item.day)}</button>` : ''}<button onclick="go('money',{tab:'overview'})">💴 ${e.category} budget</button><button onclick="go('money',{tab:'balances'})">⚖️ Balances</button>${e.docId ? `<button onclick="go('documents')">📄 Receipt file</button>` : ''}</div></div>
  </div>`;
};

/* ----- Add expense ----- */
SCREENS['expense-add'] = ({ mode }) => {
  if (!mode) return h`<div class="screen" style="max-width:560px">${backBtn('Money')}${pageHead('Add expense', 'Pick the fastest way. Everything ends up in the same place.')}
    <div class="stack">${[['📷', 'Scan receipt', 'Point the camera. OneTRIP reads the merchant, total and items.', "go('scan')"], ['✍️', 'Enter manually', 'Type the amount and choose who was there.', "go('expense-add',{mode:'manual'},{replace:true})"], ['🎤', 'Add by voice', '“Taxi, 4,800 yen, I paid, split with John and Tom.”', 'voiceSheet()']].map(([e, t, s, fn]) => `<button class="card tap row" style="gap:14px;text-align:left;width:100%" onclick="${fn}"><span style="font-size:30px">${e}</span><div class="flex1"><div class="h3">${t}</div><div class="tiny">${s}</div></div><span class="chev">›</span></button>`).join('')}</div></div>`;
  return h`<div class="screen" style="max-width:560px">${backBtn()}${pageHead('New expense')}
    <div class="stack">
      <div class="field"><label>Merchant</label><input class="input" id="x-merchant" placeholder="e.g. Family Mart" list="merchants"><datalist id="merchants">${S.places.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist></div>
      <div class="grid2"><div class="field"><label>Amount</label><input class="input big num" id="x-amount" type="number" placeholder="0"></div><div class="field"><label>Currency</label><select class="input" id="x-cur">${Object.keys(RATES).map(c => `<option ${c === 'JPY' ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <div class="grid2"><div class="field"><label>Date</label><select class="input" id="x-date">${DAY_DATES.map((d, i) => `<option value="${d}" ${i + 1 === TODAY_DAY ? 'selected' : ''}>${dayLabel(i + 1)}</option>`).join('')}</select></div><div class="field"><label>Category</label><select class="input" id="x-cat">${Object.keys(S.budget.categories).map(c => `<option>${c}</option>`).join('')}</select></div></div>
      <div class="field"><label>Paid by</label><div class="row wrap" id="x-payer">${S.people.map(p => `<button class="chip ${p.id === S.me ? 'on' : ''}" data-id="${p.id}" onclick="[...this.parentElement.children].forEach(c=>c.classList.remove('on'));this.classList.add('on')">${p.name}</button>`).join('')}</div></div>
      <div class="field"><label>Participants</label><div class="row wrap" id="x-people">${S.people.map(p => `<button class="check on" data-id="${p.id}" style="padding:6px 10px 6px 6px" onclick="this.classList.toggle('on')"><span class="box">✓</span>${av(p.id, 'sm')} ${p.name}</button>`).join('')}</div></div>
      <div class="field"><label>Notes</label><input class="input" id="x-note" placeholder="Optional"></div>
      <button class="btn primary lg block" onclick="manualToSplit()">Continue to split</button>
    </div></div>`;
};
function manualToSplit() {
  const amt = Number($('#x-amount').value); if (!amt) { toast('Enter an amount'); return; }
  const cur = $('#x-cur').value; const jpy = Math.round(amt * RATES[cur]);
  pendingExpense = { merchant: $('#x-merchant').value || 'Expense', jpy, amount: amt, currency: cur, date: $('#x-date').value, time: '09:40', category: $('#x-cat').value, payer: $('#x-payer .on').dataset.id, participants: [...document.querySelectorAll('#x-people .check.on')].map(b => b.dataset.id), note: $('#x-note').value, emoji: FOOD_EMOJI[$('#x-cat').value] };
  go('split');
}
let pendingExpense = null, pendingReceipt = null;
function addExpense(e) {
  e = Object.assign({ id: uid('e'), currency: 'JPY', date: DAY_DATES[TODAY_DAY - 1], time: '09:40', split: 'Equal' }, e);
  S.expenses.push(e);
  logActivity(`Added ${fmtJpy(e.jpy)} ${e.merchant} expense (${e.participants.length} people).`);
  notify('💰', `${P(e.payer).name} added ${fmtJpy(e.jpy)} ${e.merchant} expense.`, ['expense', e.id]);
  const cats = spentByCategory(); const pct = cats[e.category] / catBudgetJpy(e.category) * 100;
  if (pct >= 85) notify('💳', `${e.category} budget is ${Math.round(pct)}% used.`, ['money', 'overview']);
  return e;
}

/* ----- Receipt scanner ----- */
SCREENS.scan = ({ itemId, fail }) => h`<div class="screen" style="max-width:520px">${backBtn()}
  ${pageHead('Scan receipt', 'Place the whole receipt inside the frame.')}
  <div class="camera"><div class="frame"><i></i></div>
    <div class="paper"><b>SUSHI HOUSE<br>GINZA</b><div class="r"><span>2025/10/14 13:41</span><span>#0412</span></div><div style="border-top:1px dashed #999;margin:4px 0"></div><div class="r"><span>Salmon sushi</span><span>3,000</span></div><div class="r"><span>Ramen</span><span>2,000</span></div><div class="r"><span>Sashimi moriawase</span><span>4,000</span></div><div class="r"><span>Drinks ×6</span><span>3,500</span></div><div class="r"><span>Dessert ×2</span><span>2,500</span></div><div class="r tot"><span>Subtotal</span><span>16,700</span></div><div class="r"><span>Tax 10%</span><span>1,700</span></div><div class="r tot"><span>TOTAL</span><span>¥18,400</span></div><div class="r"><span>CARD ****4021</span><span>APPROVED</span></div></div>
    <div class="scanline"></div>
    <button class="shutter" aria-label="Take photo" onclick="scanReceipt('${itemId || ''}',${fail ? 'true' : 'false'})"></button>
    <div class="hint">Tap the shutter · good light helps</div></div>
  <div class="grid2 mt12"><button class="btn" onclick="go('inbox')">📁 Upload photo</button><button class="btn" onclick="go('scan',{fail:true},{replace:true});setTimeout(()=>scanReceipt('',true),200)">Try a blurry one</button></div>
  <p class="tiny center mt8">Prototype: the camera is simulated with a sample receipt.</p></div>`;
function scanReceipt(itemId, fail) {
  loadingSheet('Reading your receipt…', 1500, () => {
    if (fail) { openSheet(`<div class="badbox mb12">😕<span><b>We couldn't read this receipt.</b></span></div><p class="sub">Try:</p><ul class="sub" style="margin:6px 0 0;padding-left:20px"><li>better lighting</li><li>flatten the receipt</li><li>upload another photo</li></ul><div class="actions"><button class="btn primary" onclick="closeSheet();go('scan',{},{replace:true})">Try again</button><button class="btn" onclick="closeSheet();go('expense-add',{mode:'manual'})">Enter manually</button></div>`); return; }
    pendingReceipt = JSON.parse(JSON.stringify(DEMO_RECEIPT)); pendingReceipt.itemId = itemId || 'i12';
    closeSheet(); go('receipt', {}, { replace: true });
  });
}
function conf(v) { return `<span class="conf ${v < 0.92 ? 'mid' : ''}"><i style="--w:${Math.round(v * 100)}%"></i>${Math.round(v * 100)}%</span>`; }
SCREENS.receipt = () => {
  const r = pendingReceipt; if (!r) return SCREENS.scan({});
  const f = (label, key, type, extra) => `<div class="fr"><label>${label}</label><${type === 'select' ? 'select' : 'input'} ${type === 'select' ? '' : `type="${type || 'text'}"`} id="rc-${key}" ${type === 'select' ? '' : `value="${esc(r[key])}"`} oninput="pendingReceipt.${key}=${type === 'number' ? 'Number(this.value)' : 'this.value'}" ${extra || ''}>${type === 'select' ? Object.keys(S.budget.categories).map(c => `<option ${c === r.category ? 'selected' : ''}>${c}</option>`).join('') + '</select>' : ''}${conf(r.confidence[key])}</div>`;
  return h`<div class="screen" style="max-width:560px">${backBtn('Scan')}
    <div class="goodbox mb12">✅<span><b>We found a receipt.</b> Check the details — you can edit any field.</span></div>
    <div class="card extract">
      ${f('Merchant', 'merchant')}${f('Date', 'date', 'date')}${f('Subtotal', 'subtotal', 'number')}${f('Tax', 'tax', 'number')}${f('Total', 'total', 'number')}
      <div class="fr"><label>Currency</label><input id="rc-currency" value="JPY" oninput="pendingReceipt.currency=this.value">${conf(r.confidence.currency)}</div>
      ${f('Category', 'category', 'select')}
    </div>
    <div class="card soft mt12 row between"><span class="tiny">In ${S.reporting}</span><b>${fmtHome(r.total)}</b><span class="tiny">1 ${S.reporting} = ${RATES[S.reporting]} JPY</span></div>
    <div class="card soft mt12"><div class="row between"><span class="tiny">Linked to</span><button class="link" onclick="go('item',{id:'${r.itemId}'})">📅 ${esc(IT(r.itemId).title)} · ${esc(PL(IT(r.itemId).placeId).name)}</button></div></div>
    <div class="actions"><button class="btn" onclick="go('expense-add',{mode:'manual'})">Enter manually</button><button class="btn primary" onclick="go('itemise')">Looks correct</button></div></div>`;
};
SCREENS.itemise = () => {
  const r = pendingReceipt; if (!r) return SCREENS.scan({});
  return h`<div class="screen" style="max-width:560px">${backBtn('Receipt')}
    ${pageHead('Items', 'Tap the people who shared each item. Skip this to split equally.')}
    <div class="card">${r.items.map((it, k) => `<div class="assign"><div class="nm">${esc(it.name)}<div class="tiny num">${fmtJpy(it.jpy)}</div></div><div class="who">${S.people.map(p => `<button class="avatar sm ${it.who.includes(p.id) ? 'on' : ''}" style="background:${p.color}" onclick="toggleItemWho(${k},'${p.id}',this)">${p.initials}</button>`).join('')}</div></div>`).join('')}
      <div class="assign"><div class="nm">Tax<div class="tiny">Split in proportion</div></div><span class="num tiny">${fmtJpy(r.tax)}</span></div>
      <div class="assign"><div class="nm"><b>Total</b></div><b class="num">${fmtJpy(r.total)}</b></div></div>
    <div class="card soft mt12"><div class="eyebrow mb8">Each person pays</div>${Object.entries(itemisedShares(r)).map(([pid, v]) => `<div class="row between tiny" style="padding:4px 0"><span class="row">${av(pid, 'sm')} ${P(pid).name}</span><b class="num">${fmtJpy(v)}</b></div>`).join('')}</div>
    <div class="actions"><button class="btn" onclick="pendingReceipt.itemised=false;toSplitFromReceipt()">Split equally</button><button class="btn primary" onclick="pendingReceipt.itemised=true;toSplitFromReceipt()">Use these items</button></div></div>`;
};
function toggleItemWho(k, pid, el) { const it = pendingReceipt.items[k]; const i = it.who.indexOf(pid); if (i >= 0) it.who.splice(i, 1); else it.who.push(pid); render(); }
function itemisedShares(r) {
  const sh = {}; S.people.forEach(p => sh[p.id] = 0);
  r.items.forEach(it => { if (!it.who.length) return; it.who.forEach(w => sh[w] += it.jpy / it.who.length); });
  const sub = Object.values(sh).reduce((a, b) => a + b, 0) || 1;
  Object.keys(sh).forEach(k => sh[k] = Math.round(sh[k] + sh[k] / sub * r.tax));
  Object.keys(sh).forEach(k => { if (!sh[k]) delete sh[k]; });
  return sh;
}
function toSplitFromReceipt() {
  const r = pendingReceipt;
  pendingExpense = { merchant: r.merchant, placeId: r.placeId, jpy: r.total, amount: r.total, currency: 'JPY', date: r.date, time: r.time, category: r.category, payer: 'john', participants: S.people.map(p => p.id), emoji: '🍣', itemId: r.itemId, fromReceipt: true };
  if (r.itemised) { pendingExpense.shares = itemisedShares(r); pendingExpense.participants = Object.keys(pendingExpense.shares); pendingExpense.splitType = 'Itemised'; }
  go('split');
}

/* ----- Split ----- */
let splitType = 'Equal', splitInputs = {};
SCREENS.split = () => {
  const e = pendingExpense; if (!e) return SCREENS['expense-add']({});
  if (e.splitType && !splitInputs._init) { splitType = e.splitType; }
  if (!splitInputs._init) { splitInputs = { _init: true }; S.people.forEach(p => { splitInputs[p.id] = e.shares ? e.shares[p.id] || 0 : (splitType === 'Percentage' ? 20 : splitType === 'Shares' ? 1 : 0); }); }
  const shares = computeSplit(e); const total = Object.values(shares).reduce((a, b) => a + b, 0);
  const types = ['Equal', 'Specific amounts', 'Percentage', 'Shares', 'Itemised'];
  return h`<div class="screen" style="max-width:560px">${backBtn()}
    ${pageHead('Split ' + fmtJpy(e.jpy), `${esc(e.merchant)} · ≈ ${fmtHome(e.jpy)}`)}
    <div class="card"><div class="row"><span class="tiny">Payer</span><div class="row wrap">${S.people.map(p => `<button class="chip ${e.payer === p.id ? 'on' : ''}" style="padding:5px 10px" onclick="pendingExpense.payer='${p.id}';render()">${p.name}</button>`).join('')}</div></div></div>
    <div class="chips mt12">${types.map(t => `<button class="chip ${splitType === t ? 'on' : ''}" onclick="setSplitType('${t}')" ${t === 'Itemised' && !e.fromReceipt ? 'disabled title="Scan a receipt to itemise"' : ''}>${t}</button>`).join('')}</div>
    <div class="card mt12">
      <div class="eyebrow mb8">Participants</div>
      ${S.people.map(p => { const on = e.participants.includes(p.id); return `<div class="splitrow"><button class="check ${on ? 'on' : ''}" style="padding:4px 8px 4px 4px;border:0;background:none" onclick="toggleParticipant('${p.id}')"><span class="box">✓</span></button>${av(p.id, 'sm')}<span class="flex1" style="font-weight:600">${p.name}</span>
        ${on && splitType === 'Specific amounts' ? `<input type="number" value="${splitInputs[p.id] || ''}" placeholder="¥" oninput="splitInputs['${p.id}']=Number(this.value);refreshSplit()">` : ''}
        ${on && splitType === 'Percentage' ? `<input type="number" value="${splitInputs[p.id]}" oninput="splitInputs['${p.id}']=Number(this.value);refreshSplit()"><span class="tiny">%</span>` : ''}
        ${on && splitType === 'Shares' ? `<div class="seg"><button onclick="splitInputs['${p.id}']=Math.max(0,(splitInputs['${p.id}']||1)-1);render()">−</button><button class="on">${splitInputs[p.id] || 1}</button><button onclick="splitInputs['${p.id}']=(splitInputs['${p.id}']||1)+1;render()">+</button></div>` : ''}
        <span class="num money" id="sh-${p.id}" style="width:80px;text-align:right;${on ? '' : 'color:var(--text-3)'}">${on ? fmtJpy(shares[p.id] || 0) : '—'}</span></div>`; }).join('')}
      <div class="splitrow" style="border-top:2px solid var(--line)"><span class="flex1"><b>Total</b></span><span class="num money" id="sh-total" style="color:${Math.abs(total - e.jpy) > 1 ? 'var(--bad)' : 'var(--good)'}">${fmtJpy(total)}</span></div>
      ${Math.abs(total - e.jpy) > 1 ? `<div class="warnbox mt8">⚠️<span>Shares add up to ${fmtJpy(total)}, not ${fmtJpy(e.jpy)}. Adjust before saving.</span></div>` : ''}
    </div>
    <div class="card soft mt12 row between tiny"><span>Each share in ${S.reporting}</span><span>${e.participants.map(p => P(p).name.slice(0, 1) + ' ' + fmtHome(shares[p] || 0)).join(' · ')}</span></div>
    <button class="btn primary lg block mt16" ${Math.abs(total - e.jpy) > 1 ? 'disabled' : ''} onclick="saveSplitExpense()">Save expense</button></div>`;
};
function setSplitType(t) { splitType = t; if (t === 'Percentage') S.people.forEach(p => splitInputs[p.id] = Math.round(100 / pendingExpense.participants.length * 100) / 100); if (t === 'Shares') S.people.forEach(p => splitInputs[p.id] = 1); if (t === 'Specific amounts') S.people.forEach(p => splitInputs[p.id] = Math.round(pendingExpense.jpy / pendingExpense.participants.length)); render(); }
function toggleParticipant(pid) { const e = pendingExpense; const i = e.participants.indexOf(pid); if (i >= 0) e.participants.splice(i, 1); else e.participants.push(pid); render(); }
function computeSplit(e) {
  const sh = {}; const ps = e.participants; if (!ps.length) return sh;
  if (splitType === 'Equal') ps.forEach(p => sh[p] = e.jpy / ps.length);
  else if (splitType === 'Specific amounts') ps.forEach(p => sh[p] = splitInputs[p] || 0);
  else if (splitType === 'Percentage') ps.forEach(p => sh[p] = e.jpy * (splitInputs[p] || 0) / 100);
  else if (splitType === 'Shares') { const t = ps.reduce((a, p) => a + (splitInputs[p] || 1), 0); ps.forEach(p => sh[p] = e.jpy * (splitInputs[p] || 1) / t); }
  else if (splitType === 'Itemised') ps.forEach(p => sh[p] = (e.shares && e.shares[p]) || 0);
  return sh;
}
function refreshSplit() { const sh = computeSplit(pendingExpense); let t = 0; Object.entries(sh).forEach(([p, v]) => { const el = $('#sh-' + p); if (el) el.textContent = fmtJpy(v); t += v; }); const te = $('#sh-total'); if (te) { te.textContent = fmtJpy(t); te.style.color = Math.abs(t - pendingExpense.jpy) > 1 ? 'var(--bad)' : 'var(--good)'; } }
function saveSplitExpense() {
  const e = pendingExpense; const sh = computeSplit(e);
  loadingSheet('Checking your budget…', 900, () => {
    const rec = pendingReceipt ? { id: uid('r'), merchant: pendingReceipt.merchant, items: pendingReceipt.items, tax: pendingReceipt.tax, total: pendingReceipt.total, date: pendingReceipt.date } : null;
    if (rec) { S.receipts.push(rec); S.documents.unshift({ id: uid('d'), name: e.merchant + ' receipt.jpg', category: 'Receipts', size: '1.4 MB', linked: { type: 'expense', id: null }, addedBy: S.me, date: e.date }); }
    const saved = addExpense(Object.assign({}, e, { shares: splitType === 'Equal' ? null : sh, split: splitType, receiptId: rec ? rec.id : null, docId: rec ? S.documents[0].id : null }));
    if (rec) S.documents[0].linked.id = saved.id;
    const cats = spentByCategory(); const bud = catBudgetJpy(e.category); const pct = Math.round(cats[e.category] / bud * 100);
    pendingExpense = null; pendingReceipt = null; splitInputs = {}; splitType = 'Equal';
    closeSheet(); go('money', { tab: 'expenses' }, { replace: true });
    toast(`Saved ${fmtJpy(saved.jpy)} under ${saved.category}`, `${saved.category} budget now ${pct}% used · balances updated`, { label: 'Balances', fn: () => go('money', { tab: 'balances' }) });
  });
}

/* ----- Trip Inbox & AI import ----- */
SCREENS.inbox = ({ auto, itemId }) => h`<div class="screen" style="max-width:640px">${pageHead('Trip Inbox', 'Drop anything here. OneTRIP will organise it.')}
  <div class="addgrid mb16" style="grid-template-columns:repeat(4,1fr)">${[['📷', 'Photo', 'photo'], ['🧾', 'Receipt', 'receipt'], ['📄', 'PDF', 'pdf'], ['📧', 'Email', 'email'], ['🔗', 'Link', 'link'], ['📱', 'Screenshot', 'screenshot'], ['✍️', 'Text', 'text'], ['🎤', 'Voice', 'voice']].map(([e, l, k]) => `<button onclick="inboxAdd('${k}','${itemId || ''}')"><span class="e">${e}</span>${l}</button>`).join('')}</div>
  <div class="eyebrow mb8">Recently added</div>
  <div class="list">${S.inbox.map(it => `<div class="item"><span class="ic">${{ pdf: '📄', screenshot: '📱', email: '📧', receipt: '🧾', photo: '📷', link: '🔗', text: '✍️', voice: '🎤' }[it.kind]}</span><div class="body"><div class="title">${esc(it.name)}</div><div class="meta">${it.status === 'done' ? '✅ ' + esc(it.result) : it.status === 'failed' ? '⚠️ ' + esc(it.result) : 'Reading…'} · ${P(it.addedBy).name} · ${it.when}</div></div></div>`).join('')}</div>
  <p class="tiny mt12">Files stay attached to whatever they belong to: a booking, an expense, a place or a day.</p></div>`;
SCREENS.inbox.after = ({ auto, itemId }) => { if (auto) { route.p = {}; setTimeout(() => inboxAdd(auto, itemId || ''), 150); } };
const IMPORTS = {
  pdf: { name: 'Fuji tour confirmation.pdf', loading: 'Finding this booking…', kind: 'booking', title: 'Booking found', data: { Provider: 'Fuji Day Tours', Tour: 'Mt Fuji & Kawaguchiko guided bus tour', Date: 'Thu 16 Oct, 07:30 pick-up at Hilton Tokyo', Guests: '5', Total: '¥38,000 (¥7,600 × 5)', Reference: 'FDT-55021' }, apply: () => applyFujiBooking() },
  email: { name: 'Hotel confirmation email', loading: 'Reading this email…', kind: 'booking', title: 'Hotel booking found', data: { Hotel: 'Hilton Tokyo', 'Check-in': '12 October', 'Check-out': '20 October', Guests: '5', Total: '¥220,000', Address: '6-6-2 Nishi-Shinjuku, Tokyo' }, apply: () => { S.documents.unshift({ id: uid('d'), name: 'Hotel confirmation email.eml', category: 'Hotels', size: '38 KB', linked: { type: 'booking', id: 'b_hotel' }, addedBy: S.me, date: '2025-10-14' }); logActivity('Linked a hotel confirmation email to the Hilton Tokyo booking.'); return { msg: 'Already in your trip', sub: 'Linked the email to the existing Hilton Tokyo booking', go: ['booking', 'b_hotel'] }; } },
  receipt: { goto: 'scan' }, photo: { goto: 'scan' },
  link: { name: 'tabelog.com/tokyo/afuri-ramen', loading: 'Looking up this place…', kind: 'place', title: 'Place found', data: { Name: 'Afuri Yuzu Ramen', Area: 'Ebisu · 18 min from hotel', Rating: '4.6 ⭐ · ¥', Hours: '11:00–23:00' }, apply: () => { const p = { id: uid('pl'), name: 'Afuri Yuzu Ramen', type: 'restaurant', area: 'Ebisu', x: 160, y: 366, rating: 4.6, price: '¥', emoji: '🍜', fromHotel: 18, estPP: 1600, saved: true }; S.places.push(p); logActivity('Saved Afuri Yuzu Ramen from a link.'); return { msg: 'Saved to places', sub: 'It’s on the map and can be suggested to the group', go: ['map', p.id] }; } },
  screenshot: { name: 'IMG_2291.png', loading: 'Reading this screenshot…', fail: true },
  text: { name: 'Note', loading: 'Reading…', kind: 'note', title: 'Note', data: { Text: 'Tax-free shopping needs passports — bring them on Wednesday.' }, apply: () => { S.notes.push({ id: uid('note'), text: 'Tax-free shopping needs passports — bring them on Wednesday.', who: S.me }); logActivity('Added a note about tax-free shopping.'); return { msg: 'Note added', sub: 'Shown on Trip Home for everyone', go: ['home'] }; } },
  voice: { goto: 'voice' },
};
function inboxAdd(kind, itemId) {
  const imp = IMPORTS[kind]; if (!imp) return;
  if (imp.goto === 'scan') { go('scan', { itemId }); return; } if (imp.goto === 'voice') { voiceSheet(); return; }
  const entry = { id: uid('in'), name: imp.name, kind, status: 'reading', result: '', addedBy: S.me, when: 'Just now' }; S.inbox.unshift(entry); render();
  loadingSheet('OneTRIP is reading this…', 900, () => {
    openSheet(`<div class="loading" style="padding:28px"><div class="spinner"></div><div class="h3">${imp.loading}</div></div>`);
    setTimeout(() => {
      if (imp.fail) { entry.status = 'failed'; entry.result = "Couldn't identify this booking"; render(); openSheet(`<div class="badbox mb12">😕<span><b>We couldn't identify this booking.</b> The screenshot doesn't show a confirmation number or dates.</span></div><div class="actions"><button class="btn" onclick="closeSheet()">Discard</button><button class="btn primary" onclick="closeSheet();go('activity-add',{})">Enter manually</button></div>`); return; }
      openSheet(h`<div class="row mb12"><span style="font-size:28px">${imp.kind === 'booking' ? '🎟' : imp.kind === 'place' ? '📍' : '📝'}</span><div><div class="h2">${imp.title}</div><div class="tiny">From ${esc(imp.name)} · ${imp.kind === 'booking' ? '96% confident' : ''}</div></div></div>
        <div class="card soft extract">${Object.entries(imp.data).map(([k, v]) => `<div class="fr" style="grid-template-columns:96px 1fr"><label>${k}</label><input value="${esc(v)}"></div>`).join('')}</div>
        ${imp.kind === 'booking' ? '<p class="tiny mt8">Adding this connects it to the itinerary, map, documents and budget.</p>' : ''}
        <div class="actions"><button class="btn" onclick="closeSheet()">Discard</button><button class="btn" onclick="toast('Edit any field above, then add')">Edit</button><button class="btn primary" onclick="applyImport('${kind}','${entry.id}')">${imp.kind === 'booking' ? 'Add booking' : imp.kind === 'place' ? 'Save place' : 'Add note'}</button></div>`);
    }, 1100);
  });
}
function applyImport(kind, entryId) {
  const imp = IMPORTS[kind]; const res = imp.apply(); const entry = S.inbox.find(i => i.id === entryId); entry.status = 'done'; entry.result = res.sub;
  closeSheet(); render(); toast(res.msg, res.sub, res.go ? { label: 'View', fn: () => go(res.go[0], res.go[1] ? (res.go[0] === 'map' ? { focus: res.go[1] } : { id: res.go[1] }) : {}) } : null);
}
function applyFujiBooking() {
  const b = { id: uid('b'), type: 'activity', title: 'Mt Fuji & Kawaguchiko bus tour', ref: 'FDT-55021', provider: 'Fuji Day Tours', date: '2025-10-16', status: 'confirmed', costJpy: 38000, details: { 'Pick-up': 'Thu 16 Oct, 07:30 at Hilton Tokyo', Guests: '5', Payment: 'Pay on the day · ¥38,000' } };
  S.bookings.push(b); const doc = { id: uid('d'), name: 'Fuji tour confirmation.pdf', category: 'Activities', size: '122 KB', linked: { type: 'booking', id: b.id }, addedBy: S.me, date: '2025-10-14' }; S.documents.unshift(doc); b.docId = doc.id;
  const i = IT('i20'); i.booking = 'booked'; i.bookingId = b.id; i.costJpy = 38000; i.status = 'confirmed';
  const d = DEC('dec_fuji'); if (d.status !== 'confirmed') { d.status = 'confirmed'; d.confirmedOptionId = 'o_bus'; }
  logActivity('Added the Mount Fuji tour booking from Trip Inbox.'); notify('🎟', 'Mount Fuji tour is now booked (FDT-55021).', ['item', 'i20']);
  return { msg: 'Booking added', sub: 'Linked to Thursday’s plan, the map, documents and the budget', go: ['item', 'i20'] };
}

/* ----- Trip Brain ----- */
let chat = [];
const SUGGESTIONS = ['What are we doing tomorrow?', 'How much have we spent?', 'Who owes me?', "What haven't we booked?", 'Can we fit another restaurant on Saturday?', 'Which day is too busy?', 'Are we over budget?', 'How much have we spent on food?', 'What should we do if it rains?'];
SCREENS.brain = () => h`<div class="screen" style="max-width:680px">${pageHead('Trip Brain', 'Ask anything about your trip. Answers use your real itinerary, bookings and expenses.')}
  ${chat.length ? `<div class="chat mb16" id="chat">${chat.map(m => m.role === 'me' ? `<div class="msg me">${esc(m.text)}</div>` : `<div class="msg ai">${m.html}</div>`).join('')}</div>` : ''}
  <div class="eyebrow mb8">${chat.length ? 'Ask another' : 'Try asking'}</div>
  <div class="suggest mb12">${SUGGESTIONS.filter(s => !chat.some(m => m.text === s)).slice(0, chat.length ? 4 : 8).map(s => `<button onclick="ask('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('')}</div>
  <div class="askbar"><input class="input" id="ask-input" placeholder="Ask Trip Brain..." onkeydown="if(event.key==='Enter')ask(this.value)"><button class="btn primary" onclick="ask($('#ask-input').value)">Ask</button></div>
  <p class="tiny">Trip Brain explains its reasoning, never invents bookings or rates, and asks before changing anything.</p></div>`;
SCREENS.brain.after = () => { const c = $('#chat'); if (c) c.lastElementChild && c.lastElementChild.scrollIntoView({ block: 'end' }); };
function ask(q) {
  q = (q || '').trim(); if (!q) return;
  chat.push({ role: 'me', text: q }); chat.push({ role: 'ai', html: '<span class="thinking"><i></i><i></i><i></i></span>', pending: true }); render();
  setTimeout(() => { const a = answer(q); chat[chat.length - 1] = { role: 'ai', html: a }; render(); }, 900 + Math.random() * 500);
}
function answer(q) {
  const l = q.toLowerCase(); const spent = spentJpy(), bud = budgetJpy(), fc = forecastJpy(); const cats = spentByCategory();
  const tbl = rows => `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  if (l.includes('food') || l.includes('eat') && l.includes('spent')) {
    const food = S.expenses.filter(e => e.category === 'Food'); const rest = food.filter(e => e.placeId && PL(e.placeId).type === 'restaurant' || /lunch|dinner|izakaya|sushi|ramen/i.test(e.merchant)); const groc = food.filter(e => /konbini|grocer/i.test(e.merchant)); const coffee = food.filter(e => !rest.includes(e) && !groc.includes(e));
    const sum = a => a.reduce((x, e) => x + e.jpy, 0); const fb = catBudgetJpy('Food'); const left = fb - cats.Food;
    return `You've spent <b>${fmtJpy(cats.Food)}</b> on food so far, approximately <b>${fmtHome(cats.Food)}</b>.${tbl([['Restaurants', fmtHome(sum(rest))], ['Groceries', fmtHome(sum(groc))], ['Coffee/snacks', fmtHome(sum(coffee))], ['Food budget', fmtHome(fb, { dec: 0 })], ['Remaining', fmtHome(left)]])}<p class="mt8">${left > 0 ? `You're currently ${Math.round(cats.Food / fb * 100)}% through the food budget with ${9 - TODAY_DAY} days left, so ${left / (9 - TODAY_DAY) > 8000 ? "you're on track to stay within it" : 'evenings will need to stay around ' + fmtHome(left / (9 - TODAY_DAY)) + ' a day'}.` : "You're over the food budget."}</p><span class="conf">Based on ${food.length} food expenses · rate 1 ${S.reporting} = ${RATES[S.reporting]} JPY</span>`;
  }
  if (l.includes('tomorrow')) { const items = itemsOnDay(TODAY_DAY + 1); return `Tomorrow is <b>${dayLabel(TODAY_DAY + 1, true)}</b> — ${plural(items.length, 'plan')}.${tbl(items.map(i => [`${i.emoji} ${fmtTime(i.start)} ${esc(i.title)}`, esc(PL(i.placeId).name)]))}<p class="mt8">${items.some(i => i.status === 'proposed') ? 'Dinner at Tokyo Italian is still only proposed — nobody has confirmed it.' : 'Everything is confirmed.'} First stop is ${items[0].travelMin} min from the hotel, so leave by ${fmtTime(toHM(minutes(items[0].start) - items[0].travelMin - 5))}.</p><button class="btn xs primary mt8" onclick="go('plan',{day:${TODAY_DAY + 1}})">Open tomorrow</button>`; }
  if (l.includes('owe')) { const plan = settlementPlan(); const toMe = plan.filter(p => p.to === S.me), fromMe = plan.filter(p => p.from === S.me); const net = balances();
    return (toMe.length ? `<b>${toMe.map(p => P(p.from).name + ' owes you ' + fmtHome(p.jpy)).join(', ')}.</b>` : fromMe.length ? `You owe <b>${fromMe.map(p => P(p.to).name + ' ' + fmtHome(p.jpy)).join(', ')}</b>.` : `<b>Nobody owes you anything right now</b> — you're settled.`) + tbl(S.people.map(p => [p.name, Math.abs(net[p.id]) < 50 ? 'Settled' : (net[p.id] > 0 ? 'is owed ' : 'owes ') + fmtHome(Math.abs(net[p.id]))])) + `<p class="mt8">Across the group, ${plural(plan.length, 'payment')} would clear everything.</p><button class="btn xs primary mt8" onclick="go('money',{tab:'balances'})">See balances</button>`; }
  if (l.includes("haven't") && l.includes('book') || l.includes('not booked') || l.includes('unbooked')) { const items = S.itinerary.filter(i => i.booking === 'needed' && i.status !== 'cancelled'); const open = S.decisions.filter(d => d.status !== 'confirmed');
    return items.length ? `${plural(items.length, 'plan')} still ${items.length === 1 ? 'needs' : 'need'} a booking:${tbl(items.map(i => [`${i.emoji} ${esc(i.title)}`, dayLabel(i.day) + ' ' + fmtTime(i.start)]))}<p class="mt8">Flights, the hotel, teamLab, Disneyland and Shibuya Sky are all confirmed.${open.length ? ' ' + plural(open.length, 'decision') + ' also still open: ' + open.map(d => d.title).join(', ') + '.' : ''}</p><button class="btn xs primary mt8" onclick="go('health')">Open Trip Health</button>` : `Everything that needs a booking has one. 🎉`; }
  if (l.includes('fit') || l.includes('another restaurant') || l.includes('saturday')) { const items = itemsOnDay(7); const gaps = []; for (let k = 1; k < items.length; k++) { const g = minutes(items[k].start) - minutes(items[k - 1].end); if (g >= 60) gaps.push({ from: items[k - 1].end, to: items[k].start, g }); } const last = items[items.length - 1]; const evening = minutes(last.end) < 21 * 60 ? { from: last.end, to: '22:00', g: 22 * 60 - minutes(last.end) } : null; const best = evening || gaps[gaps.length - 1]; const near = S.places.filter(p => p.type === 'restaurant' && !items.some(i => i.placeId === p.id) && p.fromHotel <= 20);
    return best ? `<b>Yes.</b> Suggested window: <b>${fmtTime(best.from)}–${fmtTime(best.to)}</b>.<p class="mt8">Saturday currently has ${plural(items.length, 'activity').replace('activitys', 'activities')}${gaps.length ? `, with a ${gaps[0].g}-minute gap between ${fmtTime(gaps[0].from)} and ${fmtTime(gaps[0].to)}` : ''}. ${last.emoji} ${esc(last.title)} ends at ${fmtTime(last.end)}, so dinner from ${fmtTime(best.from)} works without moving anything.</p><p class="mt8">Recommended: <b>${near.length} restaurants</b> near your existing route — ${near.slice(0, 3).map(p => esc(p.name) + ' (' + p.fromHotel + ' min)').join(', ')}. Food budget has ${fmtHome(catBudgetJpy('Food') - cats.Food)} left.</p><span class="conf">Checked itinerary, travel times, opening hours and budget</span><div class="row mt8"><button class="btn xs primary" onclick="mapFilter='food';go('map')">Show options</button><button class="btn xs" onclick="go('decision',{id:'dec_satdinner'})">Saturday dinner vote</button></div>` : 'Saturday is full — every slot is taken.'; }
  if (l.includes('busy') || l.includes('too much')) { const load = DAY_DATES.map((d, i) => ({ day: i + 1, n: itemsOnDay(i + 1).length, travel: itemsOnDay(i + 1).reduce((a, x) => a + (x.travelMin || 0), 0), conflicts: dayConflicts(i + 1).size })).sort((a, b) => (b.n + b.travel / 30 + b.conflicts * 2) - (a.n + a.travel / 30 + a.conflicts * 2)); const t = load[0];
    return `<b>${dayLabel(t.day, true)}</b> is the heaviest day: ${plural(t.n, 'plan')}, about ${t.travel} minutes of travel${t.conflicts ? ` and ${plural(t.conflicts, 'travel conflict')}` : ''}.${tbl(load.slice(0, 4).map(x => [dayLabel(x.day), `${x.n} plans · ${x.travel} min travel`]))}<p class="mt8">${t.conflicts ? 'The conflict: the next stop starts before you could get there. Moving it 20 minutes later fixes it.' : 'Consider dropping the shopping stop or starting earlier.'}</p><button class="btn xs primary mt8" onclick="go('plan',{day:${t.day}})">Open that day</button>`; }
  if (l.includes('over budget') || l.includes('budget')) { return `${fc > bud ? `<b>Not yet, but you're forecast to finish about ${fmtHome(fc - bud, { dec: 0 })} over.</b>` : `<b>No — you're forecast to finish ${fmtHome(bud - fc, { dec: 0 })} under.</b>`}${tbl([['Budget', fmtHome(bud, { dec: 0 })], ['Spent so far', fmtHome(spent, { dec: 0 })], ['Committed, not yet paid', fmtHome(committedJpy(), { dec: 0 })], ['Forecast', fmtHome(fc, { dec: 0 })]])}<p class="mt8">Committed includes the hotel balance (¥56,100), the Fuji tour and the leading Saturday dinner option. Choosing Tokyo Italian instead of Sushi House would save about ${fmtHome(2000 * 5)}.</p><span class="conf">Assumes 5 people and no new plans</span>`; }
  if (l.includes('spent') || l.includes('spend')) { return `You've spent <b>${fmtJpy(spent)}</b> so far, approximately <b>${fmtHome(spent, { dec: 0 })}</b> of your ${fmtHome(bud, { dec: 0 })} budget (${Math.round(spent / bud * 100)}%).${tbl(Object.entries(cats).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).map(([k, v]) => [FOOD_EMOJI[k] + ' ' + k, fmtHome(v, { dec: 0 })]))}<p class="mt8">Biggest single expense: the hotel deposit (${fmtHome(163900, { dec: 0 })}). Forecast for the whole trip is ${fmtHome(fc, { dec: 0 })}.</p><button class="btn xs primary mt8" onclick="go('money')">Open Money</button>`; }
  if (l.includes('rain')) { return `Tomorrow's plan is mostly outdoors (Tsukiji and Ginza). If it rains:${tbl([['🎨 Swap Ginza for', 'Ginza department stores are covered — keep the stop, walk the underground passages'], ['🐟 Tsukiji', 'The inner market is covered; go early at 08:00 as planned'], ['🕹️ Alternative', 'Move Akihabara (Friday) forward — it’s indoors and 15 min away']])}<p class="mt8">I won't move anything unless you ask — say "move Akihabara to tomorrow" and I'll propose the change for the group.</p>`; }
  if (l.includes('move') && l.includes('akihabara')) { return `Here's the proposed change — nothing moves until you confirm.${tbl([['Akihabara', 'Fri 17 Oct 14:00 → Wed 15 Oct 14:00'], ['Wednesday shopping', 'Would overlap; shift to 16:30'], ['Travel', '15 min from Ginza']])}<div class="row mt8"><button class="btn xs primary" onclick="IT('i24').day=4;IT('i24').start='14:00';IT('i24').end='17:00';IT('i18').start='17:00';IT('i18').end='19:00';logActivity('Moved Akihabara to Wednesday via Trip Brain.');notify('📍','Akihabara moved to Wednesday 2:00 PM.',['plan',4]);toast('Moved Akihabara to Wednesday','The group has been notified');go('plan',{day:4})">Confirm change</button><button class="btn xs" onclick="toast('Left as is')">Leave it</button></div>`; }
  if (l.includes('doing') || l.includes('today')) { const items = todayItems(); return `Today (${dayLabel(TODAY_DAY, true)}) has ${plural(items.length, 'plan')}:${tbl(items.map(i => [`${i.emoji} ${fmtTime(i.start)} ${esc(i.title)}`, esc(PL(i.placeId).name)]))}<button class="btn xs primary mt8" onclick="go('today')">Open Today</button>`; }
  return `I can answer questions about this trip's itinerary, bookings, decisions, spending and balances — for example <i>“What are we doing tomorrow?”</i> or <i>“Who owes me?”</i>. I don't have information beyond what's in the trip, so I won't guess.`;
}

/* ----- Trip Health ----- */
SCREENS.health = () => { const checks = healthChecks(); const ov = healthOverall();
  return h`<div class="screen" style="max-width:640px">${pageHead('Trip Health', 'Everything OneTRIP is watching for you.')}
    <div class="card row" style="gap:14px"><span class="dot ${ov.tone}" style="width:18px;height:18px"></span><div><div class="eyebrow">Overall</div><div class="h2">${ov.label}</div></div><span class="tiny" style="margin-left:auto">${checks.filter(c => c.tone === 'good').length} good · ${checks.filter(c => c.tone === 'warn').length} to watch · ${checks.filter(c => c.tone === 'bad').length} urgent</span></div>
    <div class="list mt12">${checks.map(healthRow).join('')}</div>
    <p class="tiny mt12">Checks are recalculated from the plan, bookings, decisions and money every time something changes.</p></div>`; };
function resolveIssue(kind, id) {
  if (kind === 'decision') { go('decision', { id }); return; }
  const i = IT(id);
  if (id === 'i33') {
    openSheet(h`<h2 class="h2">Airport transfer</h2><p class="sub mb12">Monday 20 Oct, 10:00 · 5 people. Pick how to resolve it.</p>
      <div class="menu"><button onclick="closeSheet();go('decision',{id:'dec_transfer'})"><span class="ic">🗳</span><div>Ask the group (2 of 5 voted)<div class="tiny">Hotel bus, Narita Express or taxi van</div></div></button>
      <button onclick="bookTransfer()"><span class="ic">🚌</span><div>Book the hotel limousine bus<div class="tiny">¥3,200 × 5 = ¥16,000 · leaves 10:00</div></div></button>
      <button onclick="closeSheet();go('inbox',{auto:'pdf'})"><span class="ic">📥</span><div>I already booked it<div class="tiny">Drop the confirmation into Trip Inbox</div></div></button></div>`);
    return;
  }
  openSheet(h`<h2 class="h2">${esc(i.title)}</h2><p class="sub mb12">${dayLabel(i.day, true)} · ${fmtTime(i.start)}. This needs a booking.</p>
    <div class="menu"><button onclick="closeSheet();go('inbox',{auto:'pdf',itemId:'${id}'})"><span class="ic">📥</span><div>I have a confirmation<div class="tiny">OneTRIP reads it and links it here</div></div></button>
    <button onclick="closeSheet();go('decision',{id:'dec_fuji'})"><span class="ic">🗳</span><div>Finish the group decision first<div class="tiny">4 of 5 voted · bus tour is leading</div></div></button>
    <button onclick="markBooked('${id}')"><span class="ic">✅</span><div>Mark as booked<div class="tiny">Add the confirmation later</div></div></button></div>`);
}
function bookTransfer() { const t = IT('i33'); const b = { id: uid('b'), type: 'transport', title: 'Airport Limousine Bus · Hilton → Narita', ref: 'LMB-7781', provider: 'Airport Limousine', date: '2025-10-20', status: 'confirmed', costJpy: 16000, details: { Departs: 'Mon 20 Oct, 10:00 from Hilton Tokyo', Seats: '5', Payment: 'Pay on board' } }; S.bookings.push(b); t.booking = 'booked'; t.bookingId = b.id; t.status = 'confirmed'; t.title = 'Airport transfer · Limousine bus'; t.costJpy = 16000; const d = DEC('dec_transfer'); d.status = 'confirmed'; d.confirmedOptionId = 'o_shuttle'; logActivity('Booked the airport limousine bus for Monday.'); notify('🚌', 'Airport transfer confirmed: limousine bus, Mon 10:00.', ['item', 'i33']); closeSheet(); render(); toast('Airport transfer confirmed', 'Added to Monday, the map and the budget'); }
function markBooked(id) { const i = IT(id); i.booking = 'booked'; const b = { id: uid('b'), type: 'activity', title: i.title, ref: 'Pending', provider: '—', date: DAY_DATES[i.day - 1], status: 'confirmed', costJpy: i.costJpy, details: { Note: 'Marked booked by Jennie · confirmation not attached yet' } }; S.bookings.push(b); i.bookingId = b.id; logActivity(`Marked ${i.title} as booked.`); closeSheet(); render(); toast('Marked as booked', 'Attach the confirmation when you have it'); }

/* ----- Travel Mode ----- */
SCREENS.travel = () => { const cur = currentItem(), nxt = nextItem(); const after = todayItems().filter(i => minutes(i.start) > (nxt ? minutes(nxt.start) : 0))[0];
  const blk = (label, i, cls) => i ? `<div class="block ${cls || ''}" onclick="go('item',{id:'${i.id}'})"><span class="e">${i.emoji}</span><div class="flex1"><div class="eyebrow">${label}</div><div class="t">${esc(i.title)}</div><div class="m">${fmtTime(i.start)} · ${esc(PL(i.placeId).name)}${i.travelMin && label !== 'Now' ? ' · ' + i.travelMin + ' min away' : ''}</div></div></div>` : '';
  return h`<div class="travel"><div class="row between"><div><div class="eyebrow">Travel Mode</div><h1 class="h1">Today — ${dayWeekday(TODAY_DAY)}</h1></div><button class="btn sm outline" onclick="go('home')">Exit</button></div>
    ${cur ? blk('Now', cur, 'now') : `<div class="block now"><span class="e">☕</span><div><div class="eyebrow">Now</div><div class="t">Free time</div><div class="m">Next plan at ${nxt ? fmtTime(nxt.start) : '—'}</div></div></div>`}
    ${blk('Next', nxt)}${blk('After', after)}
    <div class="block" onclick="go('money',{tab:'balances'})"><span class="e">💴</span><div class="flex1"><div class="eyebrow">Money</div><div class="t">${myBalanceText()}</div><div class="m">Spent ${fmtHome(spentJpy(), { dec: 0 })} of ${fmtHome(budgetJpy(), { dec: 0 })}</div></div></div>
    <div class="quick"><button class="btn" onclick="mapFilter='today';go('map',{focus:'${nxt ? nxt.placeId : 'hilton'}'})">🗺 Map</button><button class="btn primary" onclick="go('brain')">✨ Trip Brain</button><button class="btn" onclick="go('scan')">🧾 Scan receipt</button><button class="btn" onclick="go('documents')">📄 Tickets</button></div></div>`; };

/* ----- More, notifications, history, documents, bookings, travellers, permissions, memories, settings ----- */
SCREENS.more = () => { const unread = S.notifications.filter(n => n.unread).length; const open = S.decisions.filter(d => d.status !== 'confirmed').length;
  const rows = [['🗳️', 'Decisions', open ? plural(open, 'open decision') : 'All decided', 'decisions', open], ['✨', 'Trip Brain', 'Ask anything about the trip', 'brain'], ['🩺', 'Trip Health', healthOverall().label, 'health'], ['📥', 'Trip Inbox', 'Drop anything, OneTRIP organises it', 'inbox'], ['🔔', 'Notifications', unread ? unread + ' unread' : 'Up to date', 'notifications', unread], ['🎟️', 'Bookings', plural(S.bookings.length, 'booking'), 'bookings'], ['📄', 'Documents', plural(S.documents.length, 'file'), 'documents'], ['👥', 'Travellers', plural(S.people.length, 'traveller'), 'travellers'], ['🕘', 'Activity history', 'Who changed what', 'history'], ['📸', 'Memories', 'After the trip', 'memories'], ['🧭', 'Travel Mode', 'Big, simple, on the go', 'travel'], ['⚙️', 'Settings', 'Currency, permissions, trip', 'settings']];
  return h`<div class="screen">${pageHead('More', `${S.trip.emoji} ${esc(S.trip.name)} · ${fmtRange()}`)}<div class="list">${rows.map(([e, t, s, r, b]) => `<button class="item tap" onclick="go('${r}')"><span class="ic">${e}</span><div class="body"><div class="title">${t}</div><div class="meta">${s}</div></div>${b ? `<span class="badge">${b}</span>` : ''}<span class="chev">›</span></button>`).join('')}</div>
  <button class="btn block mt16" onclick="go('welcome')">Switch trip / sign out</button></div>`; };
SCREENS.notifications = () => h`<div class="screen" style="max-width:600px">${pageHead('Notifications', 'Only things worth knowing.', `<button class="btn sm" onclick="S.notifications.forEach(n=>n.unread=false);render()">Mark all read</button>`)}
  <div class="list">${S.notifications.map(n => `<button class="item tap notif ${n.unread ? 'unread' : ''}" onclick="S.notifications.find(x=>x.id==='${n.id}').unread=false;go('${n.go[0]}',${n.go[1] ? (n.go[0] === 'plan' ? `{day:${n.go[1]}}` : n.go[0] === 'money' ? `{tab:'${n.go[1]}'}` : `{id:'${n.go[1]}'}`) : '{}'})"><span class="ic">${n.icon}</span><div class="body"><div class="title" style="font-weight:${n.unread ? 700 : 500}">${esc(n.text)}</div><div class="meta">${n.when}</div></div><span class="chev">›</span></button>`).join('')}</div></div>`;
SCREENS.history = () => { const groups = {}; [...S.activity].sort((a, b) => b.when.localeCompare(a.when)).forEach(a => { const d = a.when.slice(0, 10); const k = d === DAY_DATES[TODAY_DAY - 1] ? 'Today' : d === DAY_DATES[TODAY_DAY - 2] ? 'Yesterday' : new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }); (groups[k] = groups[k] || []).push(a); });
  return h`<div class="screen" style="max-width:600px">${pageHead('Activity', 'Every change, by whom, when. Nothing disappears silently.')}<div class="card hist">${Object.entries(groups).map(([k, as]) => `<div class="hd eyebrow">${k}</div>${as.map(a => `<div class="hi"><span class="tm">${fmtTime(a.when.slice(11))}</span>${av(a.who, 'sm')}<div><span class="who">${P(a.who).name}</span> <span class="muted">${esc(a.text)}</span></div></div>`).join('')}`).join('')}</div></div>`; };
let docCat = 'All';
SCREENS.documents = () => { const cats = ['All', 'Flights', 'Hotels', 'Transport', 'Activities', 'Insurance', 'Receipts', 'Other']; const list = S.documents.filter(d => docCat === 'All' || d.category === docCat);
  const linkLabel = d => { if (!d.linked || !d.linked.id) return 'Not linked'; if (d.linked.type === 'booking') { const b = BK(d.linked.id); return b ? '🎟 ' + b.title : ''; } if (d.linked.type === 'expense') { const e = EXP(d.linked.id); return e ? '💰 ' + e.merchant + ' · ' + fmtJpy(e.jpy) : ''; } return ''; };
  const linkGo = d => !d.linked || !d.linked.id ? '' : d.linked.type === 'booking' ? `go('booking',{id:'${d.linked.id}'})` : `go('expense',{id:'${d.linked.id}'})`;
  return h`<div class="screen" style="max-width:640px">${pageHead('Trip Documents', 'Every file is linked to the thing it belongs to.', `<button class="btn sm primary" onclick="go('inbox')">+ Add</button>`)}
    <div class="chips mb12">${cats.map(c => `<button class="chip ${docCat === c ? 'on' : ''}" onclick="docCat='${c}';render()">${c}</button>`).join('')}</div>
    ${list.length ? `<div class="list">${list.map(d => `<button class="item tap" onclick="${linkGo(d) || `toast('Opening ${esc(d.name)}')`}"><span class="ic">${{ Flights: '✈️', Hotels: '🏨', Transport: '🚄', Activities: '🎟️', Insurance: '🛡️', Receipts: '🧾', Other: '📄' }[d.category]}</span><div class="body"><div class="title">${esc(d.name)}</div><div class="meta">${linkLabel(d)} · ${d.size} · ${P(d.addedBy).name}</div></div><span class="chev">›</span></button>`).join('')}</div>` : `<div class="empty"><div class="e">📄</div><div class="h3">No ${docCat.toLowerCase()} documents yet.</div><p>Drop a confirmation into Trip Inbox.</p><button class="btn primary mt12" onclick="go('inbox')">Open Trip Inbox</button></div>`}</div>`; };
SCREENS.bookings = () => h`<div class="screen" style="max-width:640px">${pageHead('Bookings', 'Confirmed things, with their tickets attached.')}
  ${S.bookings.length ? `<div class="list">${S.bookings.map(b => `<button class="item tap" onclick="go('booking',{id:'${b.id}'})"><span class="ic">${{ flight: '✈️', hotel: '🏨', activity: '🎟️', transport: '🚌' }[b.type]}</span><div class="body"><div class="title">${esc(b.title)}</div><div class="meta">${new Date(b.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} · Ref ${b.ref}</div></div><span class="pill ${b.status === 'confirmed' ? 'good' : 'warn'}">${b.status}</span></button>`).join('')}</div>` : `<div class="empty"><div class="e">🎟️</div><div class="h3">No bookings yet.</div><p>Drop a confirmation into Trip Inbox.</p></div>`}
  <div class="section"><div class="eyebrow">Still to book</div><div class="list">${S.itinerary.filter(i => i.booking === 'needed').map(i => `<button class="item tap" onclick="go('item',{id:'${i.id}'})"><span class="ic">${i.emoji}</span><div class="body"><div class="title">${esc(i.title)}</div><div class="meta">${dayLabel(i.day)} · ${fmtTime(i.start)}</div></div><button class="btn xs primary" onclick="event.stopPropagation();resolveIssue('booking','${i.id}')">Resolve</button></button>`).join('') || '<div class="item"><span class="ic">✅</span><div class="body"><div class="title">Everything is booked</div></div></div>'}</div></div></div>`;
SCREENS.booking = ({ id }) => { const b = BK(id); if (!b) return SCREENS.bookings(); const items = S.itinerary.filter(i => i.bookingId === b.id); const doc = b.docId ? S.documents.find(d => d.id === b.docId) : null; const exp = S.expenses.find(e => e.bookingId === b.id);
  return h`<div class="screen" style="max-width:600px">${backBtn()}<div class="hdr"><div><div class="eyebrow">${b.provider}</div><h1 class="h1">${esc(b.title)}</h1><p class="sub">Ref <span class="mono">${b.ref}</span></p></div><span class="pill ${b.status === 'confirmed' ? 'good' : 'warn'}">${b.status}</span></div>
    <div class="card">${Object.entries(b.details).map(([k, v]) => `<div class="row between" style="padding:7px 0;border-top:1px solid var(--line-2)"><span class="tiny">${k}</span><b style="text-align:right">${esc(v)}</b></div>`).join('')}${b.costJpy ? `<div class="row between" style="padding:7px 0;border-top:1px solid var(--line-2)"><span class="tiny">Cost</span><b>${fmtJpy(b.costJpy)} <span class="tiny">≈ ${fmtHome(b.costJpy)}</span></b></div>` : ''}${b.costAud ? `<div class="row between" style="padding:7px 0;border-top:1px solid var(--line-2)"><span class="tiny">Cost</span><b>AUD $${b.costAud.toLocaleString()} <span class="tiny">paid before the trip</span></b></div>` : ''}${b.note ? `<p class="tiny mt8">${esc(b.note)}</p>` : ''}</div>
    <div class="card mt12"><div class="eyebrow mb8">Connected</div><div class="linked">${items.map(i => `<button onclick="go('item',{id:'${i.id}'})">📅 ${esc(i.title)} · ${dayLabel(i.day)}</button>`).join('')}${doc ? `<button onclick="docCat='${doc.category}';go('documents')">📄 ${esc(doc.name)}</button>` : ''}${exp ? `<button onclick="go('expense',{id:'${exp.id}'})">💰 ${fmtJpy(exp.jpy)} paid by ${P(exp.payer).name}</button>` : b.paidJpy != null ? `<button onclick="go('expense',{id:'e1'})">💰 Deposit ${fmtJpy(b.paidJpy)} paid</button>` : ''}${items[0] && items[0].placeId ? `<button onclick="go('map',{focus:'${items[0].placeId}'})">📍 Map</button>` : ''}</div></div></div>`; };
SCREENS.travellers = () => h`<div class="screen" style="max-width:600px">${pageHead('Travellers', 'Everyone sees the same trip.', `<button class="btn sm primary" onclick="go('invite')">+ Invite</button>`)}
  <div class="list">${S.people.map(p => `<button class="item tap" onclick="travellerSheet('${p.id}')">${av(p.id, 'lg')}<div class="body"><div class="title">${p.name}${p.id === S.me ? ' (you)' : ''}</div><div class="meta">${p.role[0].toUpperCase() + p.role.slice(1)} · ${p.joined ? 'Joined' : 'Invited'}</div></div><span class="pill ${p.role === 'owner' ? 'accent' : ''}">${p.role}</span></button>`).join('')}</div>
  <div class="section"><div class="eyebrow">Permissions</div><button class="card tap row" style="width:100%;text-align:left" onclick="go('permissions')"><span style="font-size:22px">🔐</span><div class="flex1"><b>Roles and what they can do</b><div class="tiny">Owner · Admin · Traveller · Viewer</div></div><span class="chev">›</span></button></div></div>`;
function travellerSheet(id) { const p = P(id); openSheet(h`<div class="row mb12">${av(id, 'lg')}<div><div class="h2">${p.name}</div><div class="tiny">${p.role} · joined 2 Sep</div></div></div>
  ${p.role === 'owner' ? '<p class="sub">Owners can\'t be removed. Transfer ownership from Settings.</p>' : `<div class="field"><label>Role</label><select class="input" onchange="P('${id}').role=this.value;logActivity('Changed ${p.name}\\'s role to '+this.value+'.');render()">${['admin', 'traveller', 'viewer'].map(r => `<option value="${r}" ${p.role === r ? 'selected' : ''}>${r[0].toUpperCase() + r.slice(1)}</option>`).join('')}</select></div>
  <div class="actions"><button class="btn" onclick="closeSheet()">Done</button><button class="btn danger" onclick="closeSheet();toast('${p.name} stays in the demo','Removing a traveller keeps their expenses and votes in history')">Remove from trip</button></div>`}`); }
SCREENS.permissions = () => { const perms = [['itinerary', 'Edit itinerary'], ['expenses', 'Add expenses'], ['vote', 'Vote'], ['invite', 'Invite people'], ['bookings', 'Edit bookings']]; const roles = ['owner', 'admin', 'traveller', 'viewer'];
  return h`<div class="screen" style="max-width:600px">${backBtn('Travellers')}${pageHead('Permissions', 'Keep it simple: four roles, five switches.')}
    <div class="card"><div class="roles"><span></span>${roles.map(r => `<span class="rh">${r}</span>`).join('')}${perms.map(([k, l]) => `<span class="rl">${l}</span>${roles.map(r => `<span class="rc"><button class="${S.permissions[r][k] ? 'on' : ''}" ${r === 'owner' ? 'disabled' : ''} onclick="S.permissions['${r}']['${k}']=!S.permissions['${r}']['${k}'];render()">${S.permissions[r][k] ? '✓' : '·'}</button></span>`).join('')}`).join('')}</div></div>
    <p class="tiny mt12">Owners always have every permission. Changes apply immediately to everyone with that role.</p></div>`; };
SCREENS.memories = () => { const places = new Set(S.itinerary.filter(i => i.placeId).map(i => i.placeId)).size; const rest = S.places.filter(p => p.type === 'restaurant').length; const spentAll = spentJpy() + committedJpy() - 32500; const big = [...S.expenses].sort((a, b) => b.jpy - a.jpy)[0]; const bestRated = [...S.places].filter(p => p.rating).sort((a, b) => b.rating - a.rating)[0];
  return h`<div class="screen" style="max-width:640px">${pageHead('Tokyo Trip', 'Preview of your trip story — it fills in as the trip happens.', '<span class="pill">Day 3 of 9</span>')}
    <div class="stats">${[[places, 'places'], [rest, 'restaurants'], [S.memories.photos, 'photos'], [fmtHome(spentAll, { dec: 0 }), 'spent so far'], [S.memories.kmWalked + ' km', 'walked'], [S.people.length, 'travellers']].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="section"><div class="eyebrow">Trip highlights</div><div class="list">${[['🍣', 'Favourite restaurant', 'Sushi House · loved by 4 of 5'], ['🎨', 'Favourite activity', 'teamLab Planets'], ['📍', 'Most visited area', 'Shibuya · 5 plans'], ['🏨', 'Biggest expense', big.merchant + ' · ' + fmtHome(big.jpy, { dec: 0 })], ['⭐', 'Best-rated place', bestRated.name + ' · ' + bestRated.rating]].map(([e, t, s]) => `<div class="item"><span class="ic">${e}</span><div class="body"><div class="title">${t}</div><div class="meta">${s}</div></div></div>`).join('')}</div></div>
    <div class="section"><div class="eyebrow">Photos</div><div class="polaroids">${['Shibuya crossing', 'Disneyland', 'Meiji Shrine', 'Izakaya night', 'Narita arrival', 'Yoyogi Park'].map(t => `<div class="polaroid">${t}</div>`).join('')}</div></div>
    <button class="btn primary lg block mt24" onclick="toast('Trip story will be ready after 20 October','Photos, places and money — all from this trip')">Create trip story</button></div>`; };
SCREENS.settings = () => h`<div class="screen" style="max-width:600px">${pageHead('Settings')}
  <div class="list"><div class="item"><span class="ic">💱</span><div class="body"><div class="title">Reporting currency</div><div class="meta">Original amounts are always kept</div></div><select class="input" style="width:auto;padding:6px 10px" onchange="S.reporting=this.value;render()">${Object.keys(RATES).map(c => `<option ${S.reporting === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
  <div class="item"><span class="ic">🎯</span><div class="body"><div class="title">Trip budget</div><div class="meta">AUD $${S.budget.total.toLocaleString()} · categories in Money</div></div><span class="chev">›</span></div>
  <button class="item tap" onclick="go('permissions')"><span class="ic">🔐</span><div class="body"><div class="title">Permissions</div><div class="meta">Roles and what they can do</div></div><span class="chev">›</span></button>
  <button class="item tap" onclick="go('notifications')"><span class="ic">🔔</span><div class="body"><div class="title">Notifications</div><div class="meta">Votes, money, itinerary changes, warnings</div></div><span class="chev">›</span></button>
  <div class="item" style="flex-direction:column;align-items:stretch"><div class="row"><span class="ic">🎨</span><div class="body"><div class="title">Look</div><div class="meta">Pick the mood. Data and layout stay the same.</div></div></div><div class="mt12">${lookPicker()}</div></div>
  <div class="item"><span class="ic">🌙</span><div class="body"><div class="title">Appearance</div><div class="meta">Follows your device</div></div><div class="seg"><button class="${!document.documentElement.dataset.theme ? 'on' : ''}" onclick="delete document.documentElement.dataset.theme;syncDark();render()">Auto</button><button class="${document.documentElement.dataset.theme === 'light' ? 'on' : ''}" onclick="document.documentElement.dataset.theme='light';syncDark();render()">Light</button><button class="${document.documentElement.dataset.theme === 'dark' ? 'on' : ''}" onclick="document.documentElement.dataset.theme='dark';syncDark();render()">Dark</button></div></div></div>
  <div class="section"><div class="eyebrow">Trip</div><div class="list"><button class="item tap" onclick="go('invite')"><span class="ic">🔗</span><div class="body"><div class="title">Invite link & code</div><div class="meta">${S.trip.link}</div></div><span class="chev">›</span></button><button class="item tap" onclick="go('welcome')"><span class="ic">🚪</span><div class="body"><div class="title">Leave trip / sign out</div></div><span class="chev">›</span></button></div></div></div>`;

/* ---------- Demo flow shortcuts (desktop bar) ---------- */
const FLOWS = [['A · Create', () => go('welcome')], ['B · Decide', () => { mapSel = 'sushihouse'; go('map', { focus: 'sushihouse' }); }], ['C · Receipt', () => go('scan')], ['D · Brain', () => go('brain')], ['E · Health', () => go('health')], ['F · Travel', () => go('travel')], ['G · Inbox', () => go('inbox')], ['H · Settle', () => go('money', { tab: 'balances' })]];

/* ---------- Boot ---------- */
(function init() {
  try { layoutPref = localStorage.getItem('onetrip-layout') || 'phone'; } catch (e) {}
  $('#lookselect').innerHTML = LOOKS.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  let savedLook = 'classic'; try { savedLook = localStorage.getItem('onetrip-look') || 'classic'; } catch (e) {}
  setLook(savedLook, true); syncDark();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncDark);
  new MutationObserver(syncDark).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  $('#flowlinks').innerHTML = FLOWS.map(([l], k) => `<button onclick="FLOWS[${k}][1]()">${l}</button>`).join('');
  applyLayout(); render();
})();

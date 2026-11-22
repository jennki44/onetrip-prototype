/** Pure time logic for 排序 (reorder): what time a moved activity gets, and how far later ones would need to move. */
export type ReorderItem = { id: string; title: string; emoji: string; start: string; end: string | null };
export type Change = { id: string; start: string; end: string | null };
export type Proposal = { movedId: string; title: string; from: string; to: string; changes: Change[]; push: { count: number; minutes: number; changes: Change[]; clamped: boolean } | null };

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (m: number) => { const c = Math.max(0, Math.min(23 * 60 + 59, Math.round(m))); return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`; };

/**
 * The day list is sorted by time, so moving a card means giving it a new time. The moved activity starts when the one
 * above it ends (or an hour after it starts), keeping its length. If later activities now overlap, offer to push them back.
 */
export function proposeMove(order: ReorderItem[], movedId: string): Omit<Proposal, "title" | "from" | "to"> & { start: string; end: string | null } {
  const idx = order.findIndex(i => i.id === movedId); const it = order[idx];
  const prev = order[idx - 1], next = order[idx + 1];
  const dur = it.end ? Math.max(0, toMin(it.end) - toMin(it.start)) : null;
  let start = toMin(it.start);
  if (prev) start = prev.end ? toMin(prev.end) : toMin(prev.start) + 60;
  else if (next) start = Math.max(0, toMin(next.start) - (dur ?? 60));
  const s = toHHMM(start), e = dur != null ? toHHMM(start + dur) : null;
  const changes: Change[] = [{ id: movedId, start: s, end: e }];
  const finish = toMin(e ?? toHHMM(start + 60));
  let push: Proposal["push"] = null;
  if (next && toMin(next.start) < finish) {
    const minutes = finish - toMin(next.start); const later = order.slice(idx + 1); let clamped = false;
    const shifted = later.map(x => { const ns = toMin(x.start) + minutes; const ne = x.end ? toMin(x.end) + minutes : null; if (ns > 1439 || (ne ?? 0) > 1439) clamped = true; return { id: x.id, start: toHHMM(ns), end: ne != null ? toHHMM(ne) : null }; });
    push = { count: later.length, minutes, changes: [...changes, ...shifted], clamped };
  }
  return { movedId, changes, push, start: s, end: e };
}

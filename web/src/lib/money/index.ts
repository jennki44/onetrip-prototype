/* Money engine. All amounts are integers in minor units (cents) of the trip's base currency.
   Pure functions — no I/O — so they can be unit tested and reused by Trip Brain. */

export type SplitType = "equal" | "amounts" | "percent" | "shares" | "itemised";

export interface ExpenseLike { id: string; payerId: string; baseMinor: number; category?: string }
export interface ShareLike { expenseId: string; userId: string; shareMinor: number }
export interface SettlementLike { fromUserId: string; toUserId: string; amountMinor: number }

/** Split an amount equally, distributing rounding cents to the first participants so the shares sum exactly. */
export function splitEqual(totalMinor: number, participants: string[]): Record<string, number> {
  const n = participants.length; if (!n) return {};
  const base = Math.floor(totalMinor / n); let rem = totalMinor - base * n;
  const out: Record<string, number> = {};
  for (const p of participants) { out[p] = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; }
  return out;
}

export function splitPercent(totalMinor: number, percents: Record<string, number>): Record<string, number> {
  const ids = Object.keys(percents); const out: Record<string, number> = {}; let acc = 0;
  ids.forEach((id, i) => {
    const v = i === ids.length - 1 ? totalMinor - acc : Math.round(totalMinor * (percents[id] || 0) / 100);
    out[id] = v; acc += v;
  });
  return out;
}

export function splitShares(totalMinor: number, shares: Record<string, number>): Record<string, number> {
  const ids = Object.keys(shares); const total = ids.reduce((a, id) => a + (shares[id] || 0), 0) || 1;
  const out: Record<string, number> = {}; let acc = 0;
  ids.forEach((id, i) => { const v = i === ids.length - 1 ? totalMinor - acc : Math.round(totalMinor * (shares[id] || 0) / total); out[id] = v; acc += v; });
  return out;
}

/** Itemised: each line is split among the people tagged on it; tax/service (if any) is added in proportion. */
export function splitItemised(items: { amountMinor: number; userIds: string[] }[], extraMinor = 0): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const it of items) { if (!it.userIds.length) continue; const each = it.amountMinor / it.userIds.length; for (const u of it.userIds) raw[u] = (raw[u] || 0) + each; }
  const sub = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const ids = Object.keys(raw); const out: Record<string, number> = {}; let acc = 0; const total = Math.round(sub) + extraMinor;
  ids.forEach((id, i) => { const v = i === ids.length - 1 ? total - acc : Math.round(raw[id] + raw[id] / sub * extraMinor); out[id] = v; acc += v; });
  return out;
}

/** Net position per user: positive = is owed, negative = owes. */
export function balances(userIds: string[], expenses: ExpenseLike[], shares: ShareLike[], settlements: SettlementLike[]): Record<string, number> {
  const net: Record<string, number> = {}; for (const u of userIds) net[u] = 0;
  for (const e of expenses) net[e.payerId] = (net[e.payerId] || 0) + e.baseMinor;
  for (const s of shares) net[s.userId] = (net[s.userId] || 0) - s.shareMinor;
  for (const s of settlements) { net[s.fromUserId] = (net[s.fromUserId] || 0) + s.amountMinor; net[s.toUserId] = (net[s.toUserId] || 0) - s.amountMinor; }
  return net;
}

/** Greedy minimum-payment plan: largest debtor pays largest creditor until everyone is within a cent. */
export function settlementPlan(net: Record<string, number>): SettlementLike[] {
  const debtors = Object.entries(net).filter(([, v]) => v < -1).map(([id, v]) => ({ id, v: -v })).sort((a, b) => b.v - a.v);
  const creditors = Object.entries(net).filter(([, v]) => v > 1).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const plan: SettlementLike[] = []; let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    plan.push({ fromUserId: debtors[i].id, toUserId: creditors[j].id, amountMinor: amt });
    debtors[i].v -= amt; creditors[j].v -= amt;
    if (debtors[i].v <= 1) i++; if (creditors[j].v <= 1) j++;
  }
  return plan;
}

/* ---- Currency ---- */
export const CURRENCY_SYMBOL: Record<string, string> = { AUD: "A$", HKD: "HK$", USD: "US$", GBP: "£", EUR: "€", JPY: "¥", SGD: "S$", NZD: "NZ$", TWD: "NT$", CNY: "¥" };
const ZERO_DECIMAL = new Set(["JPY", "KRW", "TWD"]);
export function minorUnits(currency: string) { return ZERO_DECIMAL.has(currency) ? 1 : 100; }
export function toMinor(amount: number, currency: string) { return Math.round(amount * minorUnits(currency)); }
export function fromMinor(minor: number, currency: string) { return minor / minorUnits(currency); }

/** Format a minor-unit amount in its own currency. */
export function fmtMoney(minor: number, currency: string, opts: { decimals?: number; locale?: string } = {}): string {
  const v = fromMinor(minor, currency); const abs = Math.abs(v);
  const dec = opts.decimals ?? (ZERO_DECIMAL.has(currency) || currency === "HKD" || abs >= 1000 ? 0 : Number.isInteger(abs) ? 0 : 2);
  return (CURRENCY_SYMBOL[currency] || currency + " ") + abs.toLocaleString(opts.locale || "en-AU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Convert base-currency minor units to a reporting currency using rate = units of reporting currency per 1 unit of base. */
export function convertMinor(baseMinor: number, baseCurrency: string, toCurrency: string, rate: number): number {
  if (baseCurrency === toCurrency) return baseMinor;
  return Math.round(fromMinor(baseMinor, baseCurrency) * rate * minorUnits(toCurrency));
}

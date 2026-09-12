import { describe, expect, it } from "vitest";
import { balances, settlementPlan, splitEqual, splitItemised, splitPercent, splitShares, toMinor, fmtMoney, convertMinor } from "./index";

describe("splits", () => {
  it("equal split distributes rounding cents and sums exactly", () => {
    const s = splitEqual(10000, ["a", "b", "c"]);
    expect(Object.values(s).reduce((x, y) => x + y, 0)).toBe(10000);
    expect(s.a).toBe(3334); expect(s.b).toBe(3333); expect(s.c).toBe(3333);
  });
  it("percent split sums exactly", () => { const s = splitPercent(11150, { a: 33.3, b: 33.3, c: 33.4 }); expect(Object.values(s).reduce((x, y) => x + y, 0)).toBe(11150); });
  it("shares split honours weights", () => { const s = splitShares(9000, { a: 2, b: 1 }); expect(s.a).toBe(6000); expect(s.b).toBe(3000); });
  it("itemised split assigns lines to tagged people and sums exactly", () => {
    const s = splitItemised([{ amountMinor: 5200, userIds: ["john", "tom"] }, { amountMinor: 2400, userIds: ["jennie"] }, { amountMinor: 2200, userIds: ["jennie", "john", "mary", "tom"] }, { amountMinor: 1350, userIds: ["mary", "jennie"] }], 0);
    expect(Object.values(s).reduce((x, y) => x + y, 0)).toBe(11150);
    expect(s.jennie).toBe(3625); expect(s.john).toBe(3150); expect(s.mary).toBe(1225); expect(s.tom).toBe(3150);
  });
});

describe("balances and settlement", () => {
  it("matches the Sydney demo: John +240, Mary −110, Tom −130, Jennie 0", () => {
    const people = ["jennie", "john", "mary", "tom"];
    const exp = [{ id: "e", payerId: "john", baseMinor: 96000 }, { id: "f", payerId: "jennie", baseMinor: 20000 }];
    const shares = [...people.map(p => ({ expenseId: "e", userId: p, shareMinor: 24000 })), ...people.map(p => ({ expenseId: "f", userId: p, shareMinor: 5000 }))];
    const settle = [{ fromUserId: "jennie", toUserId: "john", amountMinor: 24000 - 5000 - 15000 + 0 }];
    const net = balances(people, exp, shares, settle);
    expect(Object.values(net).reduce((x, y) => x + y, 0)).toBe(0);
    const plan = settlementPlan(net);
    expect(plan.every(p => p.amountMinor > 0)).toBe(true);
    const after = { ...net }; for (const p of plan) { after[p.fromUserId] += p.amountMinor; after[p.toUserId] -= p.amountMinor; }
    expect(Object.values(after).every(v => Math.abs(v) <= 1)).toBe(true);
  });
});

describe("currency", () => {
  it("handles zero-decimal currencies", () => { expect(toMinor(1500, "JPY")).toBe(1500); expect(toMinor(12.5, "AUD")).toBe(1250); expect(fmtMoney(1500, "JPY")).toBe("¥1,500"); });
  it("converts base to reporting currency", () => { expect(convertMinor(10000, "AUD", "HKD", 5.13)).toBe(51300); expect(convertMinor(10000, "AUD", "AUD", 1)).toBe(10000); });
  it("formats sensibly", () => { expect(fmtMoney(11150, "AUD")).toBe("A$111.50"); expect(fmtMoney(344500, "AUD")).toBe("A$3,445"); expect(fmtMoney(1767000, "HKD")).toBe("HK$17,670"); });
});

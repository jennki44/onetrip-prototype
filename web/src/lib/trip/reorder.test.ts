import { describe, expect, it } from "vitest";
import { proposeMove, type ReorderItem } from "./reorder";

const day: ReorderItem[] = [
  { id: "a", title: "Breakfast", emoji: "🍳", start: "08:00", end: "09:00" },
  { id: "b", title: "Museum", emoji: "🏛", start: "10:00", end: "12:00" },
  { id: "c", title: "Lunch", emoji: "🍜", start: "12:30", end: "13:30" },
];
const move = (from: number, to: number) => { const n = [...day]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n; };

describe("proposeMove", () => {
  it("starts the moved activity when the one above ends and keeps its length", () => {
    const r = proposeMove(move(0, 2), "a"); // breakfast after lunch
    expect(r.start).toBe("13:30"); expect(r.end).toBe("14:30"); expect(r.push).toBeNull();
  });
  it("moving to the top ends just before the next one starts", () => {
    const r = proposeMove(move(2, 0), "c"); // lunch first
    expect(r.start).toBe("07:00"); expect(r.end).toBe("08:00"); expect(r.push).toBeNull();
  });
  it("offers to push later activities back when they would overlap", () => {
    const r = proposeMove(move(2, 1), "c"); // lunch between breakfast and museum: 09:00–10:00, museum at 10:00 is fine
    expect(r.start).toBe("09:00"); expect(r.push).toBeNull();
    const long: ReorderItem[] = [day[0], { ...day[2], end: "14:00" }, day[1]]; // a 90-minute lunch (12:30–14:00) moved to 09:00 runs into the 10:00 museum
    const p = proposeMove(long, "c");
    expect(p.start).toBe("09:00"); expect(p.end).toBe("10:30"); expect(p.push?.count).toBe(1); expect(p.push?.minutes).toBe(30);
    expect(p.push?.changes.find(c => c.id === "b")).toEqual({ id: "b", start: "10:30", end: "12:30" });
  });
  it("activities with no end time count as one hour and keep no end", () => {
    const list: ReorderItem[] = [{ ...day[0], end: null }, { id: "x", title: "Walk", emoji: "🚶", start: "15:00", end: null }];
    const r = proposeMove([list[0], list[1]], "x");
    expect(r.start).toBe("09:00"); expect(r.end).toBeNull();
  });
  it("never goes past 23:59 and says so", () => {
    const late: ReorderItem[] = [{ id: "a", title: "Dinner", emoji: "🍽", start: "21:00", end: "23:30" }, { id: "b", title: "Bar", emoji: "🍸", start: "22:00", end: "23:45" }];
    const p = proposeMove(late, "b"); // bar after dinner → 23:30, end clamped
    expect(p.start).toBe("23:30"); expect(p.end).toBe("23:59");
    const three: ReorderItem[] = [late[0], { id: "n", title: "Night view", emoji: "🌃", start: "20:00", end: "22:00" }, { id: "z", title: "Snack", emoji: "🍢", start: "22:30", end: "23:00" }];
    const q = proposeMove(three, "n");
    expect(q.push?.clamped).toBe(true);
  });
});

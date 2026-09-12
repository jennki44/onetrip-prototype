import { describe, expect, it } from "vitest";
import { safeNext } from "./safeNext";

describe("safeNext", () => {
  it("accepts same-site paths", () => {
    expect(safeNext("/trips")).toBe("/trips");
    expect(safeNext("/t/abc/money?tab=balances")).toBe("/t/abc/money?tab=balances");
    expect(safeNext("/ok/path#frag")).toBe("/ok/path#frag");
  });
  it("rejects open-redirect bypasses", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\\\\evil.com", "https://evil.com", "javascript:alert(1)", "/trips\n.evil", "/a\tb", "", "trips", "/".padEnd(600, "a")]) expect(safeNext(bad)).toBe("/trips");
  });
  it("rejects non-strings", () => { expect(safeNext(null)).toBe("/trips"); expect(safeNext(42)).toBe("/trips"); });
});

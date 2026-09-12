/** Post-login redirect guard: accept only a same-site path. Rejects protocol-relative (//), backslash (/\),
    absolute URLs, schemes, whitespace/control characters and very long values. */
export function safeNext(v: unknown, fallback = "/trips"): string {
  if (typeof v !== "string" || v.length === 0 || v.length >= 500) return fallback;
  if (!/^\/(?![\/\\])[^\\\s]*$/.test(v)) return fallback;
  return v;
}

/** Two-letter initials from a display name: first letters of the first two words, or the first two characters. */
export function initialsOf(name: string) { const w = name.trim().split(/\s+/).filter(Boolean); const s = w.length >= 2 ? w[0][0] + w[1][0] : name.trim().slice(0, 2); return s.toUpperCase() || "?"; }

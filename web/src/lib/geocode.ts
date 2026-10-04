/** Best-effort geocoding through OpenStreetMap's Nominatim. Server-side only, fixed host, short timeout; returns null when unsure. */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim().slice(0, 200); if (q.length < 3) return null;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": "OneTRIP/1.0 (family trip planner)" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer); if (!r.ok) return null;
    const j = (await r.json()) as { lat?: string; lon?: string }[]; const hit = j[0]; if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat), lng = Number(hit.lon); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 };
  } catch { return null; }
}

/** Try a few phrasings of the same place, most specific first: the address as typed, then with the trip destination appended. */
export async function geocodeAny(text: string, near?: string | null): Promise<{ lat: number; lng: number } | null> {
  const t = text.trim(); if (!t) return null;
  const tries = [t, near && !t.toLowerCase().includes(near.split(",")[0].trim().toLowerCase()) ? `${t}, ${near}` : null, near ? `${t}, ${near.split(",").slice(-1)[0].trim()}` : null].filter((q, i, a): q is string => !!q && a.indexOf(q) === i);
  for (const q of tries.slice(0, 3)) { const hit = await geocode(q); if (hit) return hit; }
  return null;
}

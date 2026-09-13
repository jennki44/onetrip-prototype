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

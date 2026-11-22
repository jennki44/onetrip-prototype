/**
 * Place checking for AI suggestions: turn "Blue Bottle Kiyosumi" into a real spot with a pin and address.
 * Provider today: OpenStreetMap Nominatim (free, ~1 request a second). Shaped so a Google Places provider can be added later.
 */
export type FoundPlace = { name: string; lat: number; lng: number; address: string | null; area: string | null; country?: string | null };

export interface PlaceProvider { find(query: string, near: string | null, lang: string): Promise<FoundPlace | null> }

// Nominatim asks for at most one request per second; space calls out within this server instance.
let nextSlot = 0;
async function politeTurn() { const now = Date.now(); const wait = Math.max(0, nextSlot - now); nextSlot = Math.max(now, nextSlot) + 1100; if (wait) await new Promise(r => setTimeout(r, wait)); }

type NominatimHit = { lat?: string; lon?: string; name?: string; display_name?: string; address?: Record<string, string> };

async function nominatim(q: string, lang: string): Promise<FoundPlace | null> {
  await politeTurn();
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q.slice(0, 200))}`, { headers: { "User-Agent": "OneTRIP/1.0 (family trip planner)", "Accept-Language": lang.startsWith("zh") ? "zh-Hant,zh,en" : "en" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer); if (!r.ok) return null;
    const hit = ((await r.json()) as NominatimHit[])[0]; if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat), lng = Number(hit.lon); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const a = hit.address || {}; const area = a.suburb || a.neighbourhood || a.quarter || a.town || a.city_district || a.city || null;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const address = [street || null, a.suburb || a.town || a.city || null].filter(Boolean).join(", ") || (hit.display_name ? hit.display_name.split(",").slice(0, 3).join(",").trim() : null);
    return { name: (hit.name || q).slice(0, 120), lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, address: address ? address.slice(0, 160) : null, area: area ? area.slice(0, 60) : null };
  } catch { return null; }
}

export const osmProvider: PlaceProvider = {
  async find(query, near, lang) {
    const q = query.trim(); if (q.length < 2) return null;
    const city = near ? near.split(",")[0].trim() : "";
    // Most specific first: the search text with the trip city, then the text alone.
    const tries = [city && !q.toLowerCase().includes(city.toLowerCase()) ? `${q}, ${city}` : null, q].filter((x): x is string => !!x);
    for (const t of tries) { const hit = await nominatim(t, lang); if (hit) return hit; }
    return null;
  },
};

/** The provider in use. Swap for a Google Places provider here when one is configured. */
export function placeProvider(): PlaceProvider { return osmProvider; }

/** One Nominatim search returning up to `limit` hits (with country), or [] when unsure. */
async function nominatimMany(q: string, lang: string, limit: number): Promise<FoundPlace[]> {
  await politeTurn();
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&addressdetails=1&q=${encodeURIComponent(q.slice(0, 200))}`, { headers: { "User-Agent": "OneTRIP/1.0 (family trip planner)", "Accept-Language": lang.startsWith("zh") ? "zh-Hant,zh,en" : "en" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer); if (!r.ok) return [];
    return ((await r.json()) as NominatimHit[]).flatMap(hit => {
      const lat = Number(hit.lat), lng = Number(hit.lon); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      const a = hit.address || {}; const area = a.suburb || a.neighbourhood || a.quarter || a.town || a.city_district || a.city || null;
      const street = [a.house_number, a.road].filter(Boolean).join(" ");
      const address = [street || null, a.suburb || a.town || a.city || null].filter(Boolean).join(", ") || (hit.display_name ? hit.display_name.split(",").slice(0, 3).join(",").trim() : null);
      return [{ name: (hit.name || hit.display_name?.split(",")[0] || q).slice(0, 120), lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, address: address ? address.slice(0, 160) : null, area: area ? area.slice(0, 60) : null, country: a.country ? a.country.slice(0, 60) : null }];
    });
  } catch { return []; }
}

/**
 * 📍 收藏地點 search: first near the trip's city, then the words alone (so "香港鰂魚涌" still works on a Sydney trip).
 * Results are merged without duplicates, up to `limit`.
 */
export async function searchPlaces(query: string, near: string | null, lang: string, limit = 6): Promise<FoundPlace[]> {
  const q = query.trim(); if (q.length < 2) return [];
  const city = near ? near.split(",")[0].trim() : "";
  const tries = [city && !q.toLowerCase().includes(city.toLowerCase()) ? `${q}, ${city}` : null, q].filter((x): x is string => !!x);
  const out: FoundPlace[] = [];
  for (const t of tries) {
    for (const hit of await nominatimMany(t, lang, limit)) if (!out.some(o => Math.abs(o.lat - hit.lat) < 0.0005 && Math.abs(o.lng - hit.lng) < 0.0005)) out.push(hit);
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

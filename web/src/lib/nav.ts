/** Google Maps directions link. Uses exact coordinates when the place has them; otherwise lets Google find the address or name
    near the trip's destination, so Navigate works for every activity that says where it is. */
export function navUrl(o: { lat?: number | null; lng?: number | null; address?: string | null; name?: string | null; near?: string | null }): string | null {
  if (o.lat != null && o.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;
  const text = (o.address || o.name || "").trim(); if (!text) return null;
  const q = o.near && !text.toLowerCase().includes(o.near.split(",")[0].trim().toLowerCase()) ? `${text}, ${o.near}` : text;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

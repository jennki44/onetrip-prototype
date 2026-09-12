"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { toMinor } from "@/lib/money";

const doc = z.object({ tripId: z.string().uuid(), fileName: z.string().max(200).nullable(), storagePath: z.string().max(400).nullable(), sizeBytes: z.number().int().nonnegative().nullable(), category: z.string().max(40) });

export async function registerDocument(raw: z.input<typeof doc> & { linkedBookingId: string | null }) {
  const p = doc.extend({ linkedBookingId: z.string().uuid().nullable() }).parse(raw);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName || "Untitled", category: p.category, storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: p.linkedBookingId ? "booking" : null, linked_id: p.linkedBookingId, added_by: user.id });
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${p.fileName || "a document"} to ${p.category} documents.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

export async function addBookingFromInbox(raw: z.input<typeof doc> & { title: string; provider: string; reference: string; cost: string; itemId: string | null }) {
  const p = doc.extend({ title: z.string().trim().min(1).max(120), provider: z.string().max(80), reference: z.string().max(60), cost: z.string().max(20), itemId: z.string().uuid().nullable() }).parse(raw);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips"); const item = p.itemId ? b.items.find(i => i.id === p.itemId) : null;
  const costMinor = p.cost ? toMinor(Number(p.cost.replace(/[^\d.]/g, "")) || 0, b.trip.base_currency) : null;
  const type = p.category === "Flights" ? "flight" : p.category === "Hotels" || item?.category === "stay" ? "hotel" : p.category === "Transport" ? "transport" : "activity";
  const { data: bk } = await sb.from("bookings").insert({ trip_id: p.tripId, type, title: p.title, provider: p.provider || null, reference: p.reference || null, date: item ? new Date(new Date(b.trip.start_date + "T00:00:00").getTime() + (item.day - 1) * 86400000).toISOString().slice(0, 10) : null, status: "confirmed", cost_minor: costMinor, details: {}, created_by: user.id }).select("id").single();
  if (!bk) throw new Error("Could not add the booking");
  if (p.storagePath || p.fileName) { const { data: d } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName || `${p.title} confirmation`, category: p.category, storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: "booking", linked_id: bk.id, added_by: user.id }).select("id").single(); if (d) await sb.from("bookings").update({ document_id: d.id }).eq("id", bk.id); }
  if (item) await sb.from("itinerary_items").update({ booking: "booked", booking_id: bk.id, status: item.status === "voting" ? "confirmed" : item.status, cost_minor: costMinor ?? item.cost_minor, updated_at: new Date().toISOString() }).eq("id", item.id);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added the ${p.title} booking from Trip Inbox.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "🎟", text: `${p.title} is now booked${p.reference ? ` (${p.reference})` : ""}.`, link: item ? { screen: "item", id: item.id } : { screen: "bookings" } });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

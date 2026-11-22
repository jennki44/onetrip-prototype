"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";

/** Only travellers (owner, admin, traveller) change notes; the database rules check membership too. */
async function editor(tripId: string) {
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, sb] = await Promise.all([loadTrip(tripId), supabaseServer()]); if (!b) throw new Error("Trip not found");
  if (!["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user.id)?.role || "")) throw new Error("Only travellers can change notes");
  return { user, b, sb };
}
const clip = (s: string) => `${s.slice(0, 60)}${s.length > 60 ? "…" : ""}`;

export async function createNote(raw: { tripId: string; text: string }) {
  const p = z.object({ tripId: z.string().uuid(), text: z.string().trim().min(1).max(500) }).parse(raw);
  const { user, sb } = await editor(p.tripId);
  const { error } = await sb.from("notes").insert({ trip_id: p.tripId, user_id: user.id, text: p.text }); if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added a note: "${clip(p.text)}"` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

export async function updateNote(raw: { tripId: string; noteId: string; text?: string; pinned?: boolean }) {
  const p = z.object({ tripId: z.string().uuid(), noteId: z.string().uuid(), text: z.string().trim().min(1).max(500).optional(), pinned: z.boolean().optional() }).parse(raw);
  const { user, b, sb } = await editor(p.tripId); const note = b.notes.find(n => n.id === p.noteId); if (!note) throw new Error("That note is gone");
  const patch: { text?: string; pinned?: boolean } = {}; if (p.text !== undefined) patch.text = p.text; if (p.pinned !== undefined) patch.pinned = p.pinned;
  const { error } = await sb.from("notes").update(patch).eq("id", p.noteId).eq("trip_id", p.tripId); if (error) throw new Error(error.message);
  if (p.text !== undefined) await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Edited a note: "${clip(p.text)}"` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

export async function deleteNote(raw: { tripId: string; noteId: string }) {
  const p = z.object({ tripId: z.string().uuid(), noteId: z.string().uuid() }).parse(raw);
  const { user, b, sb } = await editor(p.tripId); const note = b.notes.find(n => n.id === p.noteId); if (!note) return;
  const { error } = await sb.from("notes").delete().eq("id", p.noteId).eq("trip_id", p.tripId); if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Deleted a note: "${clip(note.text)}"` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { aiJson, takeAi } from "@/lib/ai/client";
import { Input, PlanItem, SYSTEM, brief, nights } from "@/lib/ai/plan";

export const runtime = "nodejs";
export const maxDuration = 60;

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const DayPlan = z.object({ items: z.array(PlanItem) });
const Body = z.object({
  input: Input,
  day: z.number().int().min(1).max(21),
  outline: z.array(z.object({ day: z.number().int(), theme: z.string().max(120), area: z.string().max(120) })).max(21),
});

/**
 * Step B of the planner: one day's stops. The client calls this for every day at once, so a 5-day trip
 * takes about as long as a single day. (Server actions run one at a time, hence a plain route.)
 */
export async function POST(req: NextRequest) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "signin" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "input" }, { status: 400 });
  const { input, day, outline } = parsed.data; const n = nights(input.start, input.end);
  if (n < 0 || n > 20 || day > n + 1) return NextResponse.json({ error: "dates" }, { status: 400 });
  const sb = await supabaseServer(); if (!(await takeAi(sb, "day"))) return NextResponse.json({ error: "limit" }, { status: 429 });
  const me = outline.find(d => d.day === day);
  const others = outline.filter(d => d.day !== day).map(d => `Day ${d.day}: ${d.theme} (${d.area})`).join("; ");
  const prompt = `${brief(input, n)}\n\nPlan day ${day} of ${n + 1}: "${me?.theme || "free day"}", based around ${me?.area || "the city centre"}.\nOther days already cover: ${others || "nothing yet"}. Do not repeat their places.\nList the stops in time order, with meals at sensible times.${day === 1 ? " This is the arrival day." : ""}${day === n + 1 ? " This is the departure day; keep it light." : ""}`;
  const r = await aiJson(DayPlan, SYSTEM, prompt, { effort: "low", maxTokens: 6000 });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === "busy" ? 429 : 502 });
  const items = r.data.items.slice(0, 8).map(it => ({ ...it, start: hhmm.safeParse(it.start).success ? it.start : "10:00", end: hhmm.safeParse(it.end).success ? it.end : "" }));
  return NextResponse.json({ day, items });
}

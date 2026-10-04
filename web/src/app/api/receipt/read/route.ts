import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { currentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 6 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Media = (typeof TYPES)[number];

/** What we ask the model to read off the receipt. Everything optional: a blurry photo returns nulls, never an error. */
const Receipt = z.object({
  merchant: z.string().nullable().describe("Shop, restaurant or hotel name as printed, without address"),
  date: z.string().nullable().describe("Transaction date as YYYY-MM-DD, or null if not visible"),
  currency: z.string().nullable().describe("ISO 4217 code such as AUD, HKD, JPY; infer from the country or symbols if not printed"),
  total: z.number().nullable().describe("Grand total actually paid, including tax and tips; null if unreadable"),
  category: z.enum(["Accommodation", "Food", "Activities", "Transport", "Shopping", "Other"]).nullable().describe("Best guess at the spending category"),
  items: z.array(z.object({ name: z.string().describe("Short line-item name as printed"), amount: z.number().describe("Line total for that item in the receipt currency") })).describe("Individual purchased lines; empty if the receipt has none or they are unreadable. Exclude subtotal, tax and total lines."),
  confidence: z.enum(["high", "medium", "low"]).describe("How sure you are about merchant and total"),
});
export type ReceiptRead = z.infer<typeof Receipt>;

/** POST multipart/form-data { file } → the receipt's merchant, date, currency, total and line items. Signed-in users only. */
export async function POST(req: NextRequest) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const form = await req.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (!TYPES.includes(file.type as Media) || file.size > MAX_BYTES) return NextResponse.json({ error: "bad_file" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: process.env.ONETRIP_OCR_MODEL || "claude-opus-5",
      max_tokens: 4000,
      output_config: { format: zodOutputFormat(Receipt), effort: "low" },
      system: "You read photos of receipts, bills and booking confirmations for a family travel-expense app. Return only what is printed or clearly implied. Amounts are plain numbers in the receipt's own currency (no symbols, no thousands separators). If a value is not visible, use null rather than guessing. Hotel bookings: total is the amount payable for the stay; date is the check-in date.",
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: file.type as Media, data } }, { type: "text", text: "Read this receipt." }] }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return NextResponse.json({ error: "unreadable" }, { status: 422 });
    return NextResponse.json(response.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "busy" }, { status: 429 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ error: "api", status: e.status }, { status: 502 });
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Model for the AI helper. Override with ONETRIP_AI_MODEL; default is the current Opus. */
export const AI_MODEL = process.env.ONETRIP_AI_MODEL || "claude-opus-5-5";

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: "not_configured" | "limit" | "refused" | "busy" | "failed" };

/** Count one AI use against today's limit (ai_take in the database). Nothing is counted while AI is switched off. */
export async function takeAi(sb: SupabaseClient, kind: "plan" | "day" | "swap" | "quick", tripId?: string) {
  if (!process.env.ANTHROPIC_API_KEY) return true;
  const { data, error } = await sb.rpc("ai_take", { p_kind: kind, p_trip: tripId ?? null });
  return !error && data === true;
}

/**
 * One structured call to Claude: the answer is parsed against the zod schema.
 * Server-side refusal fallback is on ("default"), so a safety decline is retried on a suitable model automatically.
 */
/** A photo for Claude to look at (JPEG, already shrunk on the phone). */
export type AiImage = { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" };

export async function aiJson<S extends z.ZodType>(schema: S, system: string, user: string, opts: { effort?: "low" | "medium" | "high"; maxTokens?: number; image?: AiImage } = {}): Promise<AiResult<z.infer<S>>> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "not_configured" };
  const client = new Anthropic();
  try {
    const res = await client.beta.messages.parse({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: opts.image ? [{ type: "image", source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.data } }, { type: "text", text: user }] : user }],
      output_config: { format: betaZodOutputFormat(schema), effort: opts.effort ?? "medium" },
    });
    if (res.stop_reason === "refusal") return { ok: false, error: "refused" };
    if (!res.parsed_output) return { ok: false, error: "failed" };
    return { ok: true, data: res.parsed_output as z.infer<S> };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: "not_configured" };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: "busy" };
    return { ok: false, error: "failed" };
  }
}

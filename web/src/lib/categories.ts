/** Spending categories. The six built-ins are translated; categories a trip adds itself are shown by the name it was given. */
export const BUILTIN_CATEGORIES = ["Accommodation", "Food", "Activities", "Transport", "Shopping", "Other"] as const;
export const CAT_EMOJI: Record<string, string> = { Accommodation: "🏨", Food: "🍽️", Activities: "🎟️", Transport: "🚗", Shopping: "🛍️", Other: "📦" };
export const catEmoji = (c: string) => CAT_EMOJI[c] || "🏷️";
export function catLabel(t: (key: string, vars?: Record<string, string | number>) => string, c: string): string {
  return (BUILTIN_CATEGORIES as readonly string[]).includes(c) ? t(`money.categories.${c}`) : c;
}

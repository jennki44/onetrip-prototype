import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

export function Avatar({ p, size = "md" }: { p: Pick<Profile, "name" | "initials" | "color">; size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 24 : size === "lg" ? 44 : 32;
  return <span className="avatar" style={{ background: p.color, width: px, height: px, fontSize: px * 0.36 }} title={p.name}>{p.initials}</span>;
}
export function Avatars({ people, max = 5 }: { people: Pick<Profile, "name" | "initials" | "color">[]; max?: number }) {
  return (
    <span className="inline-flex">
      {people.slice(0, max).map((p, i) => <span key={i} className="-ml-2 first:ml-0 rounded-full ring-2 ring-surface"><Avatar p={p} /></span>)}
      {people.length > max && <span className="avatar -ml-2 bg-surface-2 text-ink-2 ring-2 ring-surface">+{people.length - max}</span>}
    </span>
  );
}
export function Pill({ tone, children }: { tone?: "good" | "warn" | "bad" | "teal" | "sun"; children: React.ReactNode }) {
  return <span className={`pill ${tone ? `pill-${tone}` : ""}`}>{children}</span>;
}
export function Eyebrow({ children, action }: { children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="eyebrow mb-2 flex items-center justify-between">
      <span>{children}</span>
      {action && <Link href={action.href} className="normal-case tracking-normal text-[0.8125rem] font-extrabold text-teal-text">{action.label} ›</Link>}
    </div>
  );
}
export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div><h1 className="text-[1.75rem] leading-tight">{title}</h1>{sub && <p className="text-ink-2 text-[0.9063rem]">{sub}</p>}</div>
      {right}
    </div>
  );
}
export function Bar({ pct, tone, ghost }: { pct: number; tone?: "good" | "warn" | "bad"; ghost?: number }) {
  const color = tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : tone === "good" ? "var(--good)" : "var(--teal)";
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      {ghost ? <i style={{ width: `${Math.max(0, Math.min(100 - pct, ghost))}%`, background: "repeating-linear-gradient(45deg, var(--warn) 0 4px, transparent 4px 8px)", opacity: 0.6, borderRadius: "0 999px 999px 0" }} /> : null}
    </div>
  );
}
export function Empty({ emoji, title, sub, action }: { emoji: string; title: string; sub?: string; action?: React.ReactNode }) {
  return <div className="py-10 text-center text-ink-2"><div className="mb-2 text-[2.5rem]">{emoji}</div><h3 className="text-ink text-[1rem]">{title}</h3>{sub && <p className="mt-1">{sub}</p>}{action && <div className="mt-3">{action}</div>}</div>;
}

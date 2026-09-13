import Image from "next/image";
import Link from "next/link";

/** The OneTRIP mark: app icon plus wordmark. `size` is the icon edge in px; the wordmark scales with it. */
export function Logo({ size = 40, href = "/", className = "" }: { size?: number; href?: string | null; className?: string }) {
  const inner = (
    <span className={`inline-flex items-center gap-[0.35em] ${className}`} style={{ fontSize: size * 0.62 }}>
      <Image src="/icon.svg" alt="" width={size} height={size} priority className="shrink-0 rounded-[24%] shadow-card" style={{ width: size, height: size }} />
      <span className="font-display font-extrabold leading-none tracking-tight text-teal-text">One<span className="text-teal">TRIP</span></span>
    </span>
  );
  return href ? <Link href={href} aria-label="OneTRIP" className="inline-flex">{inner}</Link> : inner;
}

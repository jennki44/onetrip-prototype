/** Shown the instant a trip screen starts loading, before its data arrives. */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-3 w-40 rounded-full bg-line" /><div className="mt-3 h-8 w-56 rounded-xl bg-line" /><div className="mt-2 h-3 w-64 rounded-full bg-line-2" />
      <div className="mt-6 h-40 rounded-[28px] bg-line-2" />
      <div className="mt-5 h-3 w-24 rounded-full bg-line" /><div className="mt-3 h-14 rounded-2xl bg-line-2" /><div className="mt-2 h-14 rounded-2xl bg-line-2" /><div className="mt-2 h-14 rounded-2xl bg-line-2" />
    </div>
  );
}

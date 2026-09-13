"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";

/** Pick a photo: upload from the phone, or choose one already in the day's plans. Writes the URL into a hidden input. */
export function PhotoField({ name, tripId, initial, options }: { name: string; tripId: string; initial: string | null; options: { url: string; label: string }[] }) {
  const { t } = useT(); const [url, setUrl] = useState(initial || ""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return; setErr(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErr("JPEG, PNG or WebP only."); return; }
    if (f.size > 10 * 1024 * 1024) { setErr("Photos must be under 10 MB."); return; }
    setBusy(true);
    try {
      const key = `${tripId}/days/${crypto.randomUUID()}.${f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg"}`;
      const sb = supabaseBrowser(); const { error } = await sb.storage.from("photos").upload(key, f, { contentType: f.type }); if (error) throw error;
      setUrl(sb.storage.from("photos").getPublicUrl(key).data.publicUrl);
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  };
  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="relative overflow-hidden rounded-[22px] bg-surface-2">
        {url ? <img src={url} alt="" className="h-[180px] w-full object-cover" /> : <div className="flex h-[180px] items-center justify-center text-ink-3">{t("dayEdit.none")}</div>}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-[rgba(12,20,24,.45)] font-extrabold text-white">{t("common.loading")}</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="btn btn-teal btn-sm cursor-pointer">{t("dayEdit.upload")}<input type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} /></label>
        {url && <button type="button" onClick={() => setUrl("")} className="btn btn-sm">{t("dayEdit.remove")}</button>}
      </div>
      {err && <p className="mt-2 text-[0.85rem] font-bold text-bad" role="alert">{err}</p>}
      {options.length > 0 && (
        <div className="mt-3">
          <div className="eyebrow mb-1.5">{t("dayEdit.fromPlans")}</div>
          <div className="grid grid-cols-4 gap-2">{options.map(o => <button key={o.url} type="button" title={o.label} onClick={() => setUrl(o.url)} className={`overflow-hidden rounded-xl border-[3px] ${url === o.url ? "border-teal" : "border-transparent"}`}><img src={o.url} alt={o.label} className="h-16 w-full object-cover" /></button>)}</div>
        </div>
      )}
    </div>
  );
}

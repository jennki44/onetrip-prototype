"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ExpenseForm } from "./ExpenseForm";
import type { ReceiptRead } from "@/app/api/receipt/read/route";

type Props = React.ComponentProps<typeof ExpenseForm>;
type Scan = { key: number; path: string | null; read: ReceiptRead | null; note: string | null };

/** Shrink a photo before sending it anywhere: receipts read fine at 1600px and it saves mobile data. Falls back to the original. */
async function shrink(f: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(f); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
  } catch { return f; }
}

/** Photo first. The photo is stored with the receipt and read by OneTRIP; the fields below are pre-filled and stay editable. */
export function ReceiptCapture(props: Props) {
  const { t } = useT(); const [preview, setPreview] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan>({ key: 0, path: null, read: null, note: null });
  const onFile = async (f: File | null) => {
    if (!f) return; setErr(null);
    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(f.type) || f.size > 10 * 1024 * 1024) { setErr(t("receipt.badFile")); return; }
    setPreview(URL.createObjectURL(f)); setBusy(true);
    const small = await shrink(f); const sendable = small.type === "image/jpeg" || small.type === "image/png" || small.type === "image/webp";
    const key = `${props.tripId}/${crypto.randomUUID()}.${small.type === "image/jpeg" ? "jpg" : f.name.split(".").pop() || "jpg"}`;
    const upload = supabaseBrowser().storage.from("receipts").upload(key, small, { contentType: small.type }).then(r => (r.error ? null : key)).catch(() => null);
    const read = sendable ? (async () => { const fd = new FormData(); fd.append("file", small, "receipt.jpg"); const r = await fetch("/api/receipt/read", { method: "POST", body: fd }); const j = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, body: j as ReceiptRead & { error?: string } }; })().catch(() => ({ ok: false, status: 0, body: { error: "network" } as ReceiptRead & { error?: string } })) : Promise.resolve({ ok: false, status: 415, body: { error: "bad_file" } as ReceiptRead & { error?: string } });
    const [path, res] = await Promise.all([upload, read]);
    const note = res.ok ? (res.body.confidence === "low" ? t("receipt.readLow") : t("receipt.readDone")) : res.body.error === "not_configured" ? t("receipt.notConfigured") : res.status === 415 ? t("receipt.heicNote") : t("receipt.failed");
    setScan(s => ({ key: s.key + 1, path, read: res.ok ? res.body : null, note })); setBusy(false);
  };
  const r = scan.read; const manyPeople = props.members.length > 1; const everyone = props.members.map(m => m.id);
  const initial = { receiptImagePath: scan.path || undefined, merchant: r?.merchant || undefined, amount: r?.total != null ? String(r.total) : undefined, date: r?.date || undefined, currency: r?.currency || undefined, category: r?.category && props.categories.includes(r.category) ? r.category : undefined };
  const initialItems = manyPeople && r && r.items.length > 1 ? r.items.map(it => ({ name: it.name, amount: String(it.amount), userIds: everyone })) : undefined;
  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex aspect-[3/4] max-h-[46vh] cursor-pointer items-center justify-center overflow-hidden rounded-[22px] bg-[#0e1416] text-white">
        {preview ? <img src={preview} alt="" className="h-full w-full object-contain" /> : <div className="text-center"><div className="text-[2.75rem]">📷</div><div className="mt-1 text-[1rem] font-bold">{t("money.scan")}</div><div className="text-[0.8125rem] text-white/70">{t("receipt.frame")}</div></div>}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" className="hidden" onChange={e => onFile(e.target.files?.[0] || null)} />
        {busy && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-[1rem] font-bold"><span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white border-b-transparent" />{t("receipt.reading")}</div>}
      </label>
      {err && <p className="text-[0.85rem] font-bold text-bad" role="alert">{err}</p>}
      {scan.note && <p className={`rounded-2xl p-3 text-[0.9rem] font-bold ${r ? "bg-good-soft" : "bg-warn-soft"}`} role="status">{r ? "✅ " : "ℹ️ "}{scan.note}</p>}
      {!r && !busy && <p className="text-[0.8125rem] text-ink-3">{t("receipt.manualHint")}</p>}
      <ExpenseForm key={scan.key} {...props} initialItems={initialItems} initial={initial} />
    </div>
  );
}

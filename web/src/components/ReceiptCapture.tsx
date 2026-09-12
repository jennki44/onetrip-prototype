"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ExpenseForm } from "./ExpenseForm";

type Props = React.ComponentProps<typeof ExpenseForm>;

/** Photo first, then itemise. OCR is a later milestone: today the photo is stored with the receipt and the lines are typed. */
export function ReceiptCapture(props: Props) {
  const { t } = useT(); const [preview, setPreview] = useState<string | null>(null); const [path, setPath] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const onFile = async (f: File | null) => {
    if (!f) return; setErr(null); if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(f.type) || f.size > 10 * 1024 * 1024) { setErr("Please choose a JPEG, PNG, WebP or HEIC photo under 10 MB."); return; }
    setPreview(URL.createObjectURL(f)); setBusy(true);
    try { const key = `${props.tripId}/${crypto.randomUUID()}.${f.name.split(".").pop() || "jpg"}`; const { error } = await supabaseBrowser().storage.from("receipts").upload(key, f, { contentType: f.type }); if (error) throw error; setPath(key); }
    catch (e) { setErr(e instanceof Error ? e.message : t("errors.generic")); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex aspect-[3/4] max-h-[46vh] cursor-pointer items-center justify-center overflow-hidden rounded-[22px] bg-[#0e1416] text-white">
        {preview ? <img src={preview} alt="" className="h-full w-full object-contain" /> : <div className="text-center"><div className="text-[44px]">📷</div><div className="mt-1 text-[14px] font-bold">{t("money.scan")}</div><div className="text-[12px] text-white/70">{t("receipt.frame")}</div></div>}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" className="hidden" onChange={e => onFile(e.target.files?.[0] || null)} />
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[14px] font-bold">{t("receipt.reading")}</div>}
      </label>
      {err && <p className="text-[13px] text-bad">{err}</p>}
      <p className="text-[12.5px] text-ink-3">{t("receipt.assign")}</p>
      <ExpenseForm {...props} initialItems={[{ name: "", amount: "", userIds: props.members.map(m => m.id) }]} initial={{ receiptImagePath: path || undefined }} />
    </div>
  );
}

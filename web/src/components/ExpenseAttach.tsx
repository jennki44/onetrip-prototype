"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { attachToExpense } from "@/app/t/[tripId]/money/actions";

const OK = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

/** Photos are shrunk to 1600px before upload to save mobile data; PDFs and formats the browser cannot decode go up as they are. */
async function shrink(f: File): Promise<{ blob: Blob; ext: string }> {
  if (!f.type.startsWith("image/")) return { blob: f, ext: f.name.split(".").pop() || "pdf" };
  try {
    const bmp = await createImageBitmap(f); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    const blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
    return { blob, ext: "jpg" };
  } catch { return { blob: f, ext: f.name.split(".").pop() || "jpg" }; }
}

/** Add receipt photos, tickets or other documents to an expense. Several files at once; everyone in the trip can view them. */
export function ExpenseAttach({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  const { t } = useT(); const router = useRouter(); const [busy, setBusy] = useState(0); const [err, setErr] = useState<string | null>(null);
  const onFiles = async (list: FileList | null) => {
    const files = [...(list || [])]; if (!files.length) return; setErr(null);
    const bad = files.find(f => !OK.includes(f.type) || f.size > 15 * 1024 * 1024); if (bad) { setErr(t("ui.attachBad")); return; }
    setBusy(files.length);
    try {
      for (const f of files) {
        const { blob, ext } = await shrink(f); const base = f.name.replace(/\.[^.]+$/, "").replace(/[^\w\-]+/g, "_").slice(0, 60) || "file";
        const key = `${tripId}/expenses/${expenseId}/${crypto.randomUUID()}-${base}.${ext}`;
        const { error } = await supabaseBrowser().storage.from("documents").upload(key, blob, { contentType: blob.type || f.type }); if (error) throw error;
        await attachToExpense({ tripId, expenseId, fileName: f.name.slice(0, 200), storagePath: key, sizeBytes: blob.size });
        setBusy(n => n - 1);
      }
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("errors.generic")); } finally { setBusy(0); }
  };
  return (
    <div>
      <label className={`btn btn-teal w-full cursor-pointer py-3.5 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? `${t("ui.uploading")} (${busy})` : t("ui.addAttachment")}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="hidden" onChange={e => { onFiles(e.target.files); e.target.value = ""; }} />
      </label>
      {err && <p className="mt-2 text-[0.85rem] font-bold text-bad" role="alert">{err}</p>}
    </div>
  );
}

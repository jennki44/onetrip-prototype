"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { addItemPhoto } from "@/app/t/[tripId]/plan/actions";

/** Shrink to 1600px JPEG before upload: plenty for a phone album and far lighter on mobile data. Falls back to the original. */
async function shrink(f: File): Promise<{ blob: Blob; ext: string }> {
  try {
    const bmp = await createImageBitmap(f); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    const blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
    return { blob, ext: "jpg" };
  } catch { return { blob: f, ext: f.name.split(".").pop() || "jpg" }; }
}

/** Add photos taken during an activity. Several at once, from the camera or the photo library. */
export function ItemPhotoAdd({ tripId, itemId }: { tripId: string; itemId: string }) {
  const { t } = useT(); const router = useRouter(); const [busy, setBusy] = useState(0); const [err, setErr] = useState<string | null>(null);
  const onFiles = async (list: FileList | null) => {
    const files = [...(list || [])]; if (!files.length) return; setErr(null);
    if (files.length > 20) { setErr(t("item.photosTooMany")); return; }
    const bad = files.find(f => !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(f.type) || f.size > 15 * 1024 * 1024); if (bad) { setErr(t("item.photosBad")); return; }
    setBusy(files.length);
    try {
      for (const f of files) {
        const { blob, ext } = await shrink(f);
        const key = `${tripId}/items/${itemId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabaseBrowser().storage.from("documents").upload(key, blob, { contentType: blob.type || f.type }); if (error) throw error;
        await addItemPhoto({ tripId, itemId, fileName: f.name.slice(0, 200), storagePath: key, sizeBytes: blob.size });
        setBusy(n => n - 1);
      }
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("errors.generic")); } finally { setBusy(0); }
  };
  return (
    <div>
      <label className={`btn btn-teal w-full cursor-pointer py-3.5 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? `${t("ui.uploading")} (${busy})` : t("item.addPhotos")}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={e => { onFiles(e.target.files); e.target.value = ""; }} />
      </label>
      {err && <p className="mt-2 text-[0.85rem] font-bold text-bad" role="alert">{err}</p>}
    </div>
  );
}

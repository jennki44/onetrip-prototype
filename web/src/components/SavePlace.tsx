"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import type { FoundPlace } from "@/lib/places";
import { savePlace } from "@/app/t/[tripId]/plan/place-actions";
import { PlaceSearch } from "./PlaceSearch";

/** 📍 收藏地點: search a place and keep it as a ⭐ (no time set). After saving, the saved-places page opens with it highlighted. */
export function SavePlace({ tripId, onClose, onSaved }: { tripId: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const { t } = useT(); const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const save = async (name: string, place: FoundPlace | null) => {
    setErr(null); setBusy(true);
    try { const r = await savePlace({ tripId, name: name.slice(0, 120), place }); onSaved(t("savePlace.saved", { name })); onClose(); router.push(`/t/${tripId}/saved?new=${r.id}`); }
    catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("savePlace.title")}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-3 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between"><button type="button" onClick={onClose} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">📍 {t("savePlace.title")}</h2><span className="w-16" /></div>
        <p className="text-ink-2">{t("savePlace.hint")}</p>
        <PlaceSearch tripId={tripId} autoFocus busy={busy} onPick={h => save(h.name, h)} onNone={q => <button type="button" disabled={busy || !q} onClick={() => save(q, null)} className="btn btn-sm self-start">{t("savePlace.saveName", { name: q })}</button>} />
        {busy && <p className="text-center font-bold text-ink-2" role="status">{t("snap.saving")}</p>}
        {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
        <Link href={`/t/${tripId}/saved`} onClick={onClose} className="mt-2 self-center text-[0.875rem] font-bold text-ink-2 underline underline-offset-4">⭐ {t("saved.open")}</Link>
      </div>
    </div>
  );
}

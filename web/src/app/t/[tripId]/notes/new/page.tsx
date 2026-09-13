import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { addNote } from "./actions";

export default async function NewNote({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const { t } = await getT(); const base = `/t/${tripId}`;
  return (
    <div className="mx-auto max-w-[560px]"><Link href={base} className="mb-2 inline-block text-[0.875rem] font-extrabold text-ink-2">‹ {t("common.back")}</Link><h1 className="text-[1.75rem]">{t("ui.addNote")}</h1><p className="mb-4 text-ink-2">{t("ui.addNoteSub")}</p>
      <form action={addNote} className="flex flex-col gap-3"><input type="hidden" name="tripId" value={tripId} /><textarea name="text" required maxLength={500} className="input min-h-24" placeholder={t("ui.notePh")} /><button className="btn btn-sun w-full py-4">{t("common.save")}</button></form>
    </div>
  );
}

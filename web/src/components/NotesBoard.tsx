"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { createNote, deleteNote, updateNote } from "@/app/t/[tripId]/notes/actions";

type N = { id: string; text: string; pinned: boolean; by: string; when: string };

/** 備註: trip-wide notes everyone can add, edit, delete and pin (pinned ones also show on 今日). */
export function NotesBoard({ tripId, notes, canEdit }: { tripId: string; notes: N[]; canEdit: boolean }) {
  const { t } = useT(); const router = useRouter();
  const [text, setText] = useState(""); const [editing, setEditing] = useState<string | null>(null); const [draft, setDraft] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const run = async (f: () => Promise<unknown>) => { setErr(null); setBusy(true); try { await f(); router.refresh(); return true; } catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); return false; } finally { setBusy(false); } };

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <form onSubmit={async e => { e.preventDefault(); if (text.trim() && await run(() => createNote({ tripId, text }))) setText(""); }} className="card flex flex-col gap-2 p-3">
          <textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} className="input min-h-20" placeholder={t("ui.notePh")} />
          <button disabled={busy || !text.trim()} className="btn btn-sun self-end disabled:opacity-60">{t("notes.add")}</button>
        </form>
      )}
      {notes.length === 0 && <div className="card text-ink-2">{t("notes.empty")}</div>}
      {notes.map(n => (
        <div key={n.id} className={`card flex flex-col gap-2 p-4 ${n.pinned ? "border-2 border-sun" : ""}`}>
          {editing === n.id ? (<>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={500} autoFocus className="input min-h-20" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="btn btn-sm">{t("snap.cancel")}</button><button type="button" disabled={busy || !draft.trim()} onClick={async () => { if (await run(() => updateNote({ tripId, noteId: n.id, text: draft }))) setEditing(null); }} className="btn btn-sun btn-sm disabled:opacity-60">{t("common.save")}</button></div>
          </>) : (<>
            <div className="whitespace-pre-wrap text-[0.9688rem]">{n.pinned && "📌 "}{n.text}</div>
            <div className="flex items-center justify-between gap-2 text-[0.75rem] text-ink-3"><span>{n.by} · {n.when}</span>
              {canEdit && <span className="flex gap-1">
                <button type="button" disabled={busy} onClick={() => run(() => updateNote({ tripId, noteId: n.id, pinned: !n.pinned }))} className="btn btn-sm">{n.pinned ? t("notes.unpin") : t("notes.pin")}</button>
                <button type="button" disabled={busy} onClick={() => { setEditing(n.id); setDraft(n.text); }} className="btn btn-sm">{t("notes.edit")}</button>
                <button type="button" disabled={busy} onClick={() => { if (confirm(t("notes.deleteConfirm"))) run(() => deleteNote({ tripId, noteId: n.id })); }} className="btn btn-sm text-bad">{t("notes.delete")}</button>
              </span>}
            </div>
          </>)}
        </div>
      ))}
      {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
    </div>
  );
}

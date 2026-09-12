"use client";
import { useState } from "react";

const TASKS = [["🗳", "Vote for the Friday family dinner", "Find the group decision and vote for the place you like."], ["💵", "Find out how much the group has spent", "And who owes whom."], ["🧾", "Add a lunch receipt", "Photograph it, type the lines, split it, save it."]];
const TO = "jennki38@gmail.com";

export function FeedbackForm() {
  const [v, setV] = useState({ name: "", q1: "", q2: "", q3: "", use: "" });
  const send = () => { const body = [`Name: ${v.name}`, "", "1. What is this app for?", v.q1, "", "2. Where did you get stuck?", v.q2, "", "3. Tapped that did nothing / wanted:", v.q3, "", `Would use it: ${v.use}`].join("\n"); window.location.href = `mailto:${TO}?subject=${encodeURIComponent("OneTRIP feedback")}&body=${encodeURIComponent(body)}`; };
  return (
    <div className="flex flex-col gap-3">
      <div className="card divide-y divide-line-2 p-0">{TASKS.map(([e, t, s]) => <div key={t} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[19px]">{e}</span><div><div className="font-bold">{t}</div><div className="text-[13px] text-ink-2">{s}</div></div></div>)}</div>
      {[["name", "Your name", false], ["q1", "1 · In your own words, what is this app for?", true], ["q2", "2 · Where did you get stuck or feel unsure?", true], ["q3", "3 · What did you tap that did nothing, or want that wasn't there?", true]].map(([k, label, area]) => <label key={k as string} className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{label as string}{area ? <textarea className="input min-h-20" value={v[k as keyof typeof v]} onChange={e => setV({ ...v, [k as string]: e.target.value })} /> : <input className="input" value={v[k as keyof typeof v]} onChange={e => setV({ ...v, [k as string]: e.target.value })} />}</label>)}
      <div className="flex flex-wrap gap-1.5">{["Definitely", "Probably", "Not sure", "No"].map(o => <button key={o} type="button" onClick={() => setV({ ...v, use: o })} className={`rounded-full border-2 px-3.5 py-1.5 text-[13px] font-extrabold ${v.use === o ? "border-ink bg-ink text-ground" : "border-line bg-surface"}`}>{o}</button>)}</div>
      <button type="button" onClick={send} disabled={!v.q1 && !v.q2 && !v.q3} className="btn btn-sun w-full py-4 text-[16px] disabled:opacity-50">Send feedback</button>
      <p className="text-center text-[12.5px] text-ink-3">Opens your email app with the answers filled in.</p>
    </div>
  );
}

import { getT } from "@/lib/i18n/server";
import { createTrip } from "./actions";

const STYLES = [["🧘", "relaxed"], ["⚖️", "balanced"], ["⚡", "busy"], ["🥾", "adventure"], ["🍜", "food"], ["👨‍👩‍👧", "family"], ["💸", "budget"], ["💎", "luxury"]];
const CURRENCIES = ["AUD", "HKD", "USD", "GBP", "EUR", "JPY", "SGD", "TWD", "CNY"];

export default async function NewTrip({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams; const { t } = await getT();
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pt-8">
      <h1 className="text-[28px]">{t("create.where")}</h1><p className="mb-4 text-ink-2">{t("create.basics")}</p>
      <form action={createTrip} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.destination")}<input name="destination" required maxLength={80} className="input" placeholder="e.g. Sydney, Australia" /></label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">Trip name<input name="name" required maxLength={80} className="input" placeholder="e.g. Sydney Family Trip" /></label>
        <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.start")}<input name="start" type="date" required className="input" /></label><label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.end")}<input name="end" type="date" required className="input" /></label></div>
        <div><div className="eyebrow mb-2">{t("create.style")}</div><div className="grid grid-cols-4 gap-2">{STYLES.map(([e, k]) => <label key={k} className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-line bg-surface px-1 py-3 text-[12.5px] font-extrabold has-[:checked]:border-teal has-[:checked]:bg-teal-soft"><input type="checkbox" name="styles" value={k} className="hidden" /><span className="text-[22px]">{e}</span>{t(`create.styles.${k}`)}</label>)}</div></div>
        <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.tripCurrency")}<select name="base" className="input" defaultValue="AUD">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label><label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.homeCurrency")}<select name="home" className="input" defaultValue="HKD">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label></div>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{t("create.groupBudget")}<input name="budget" inputMode="decimal" className="input num font-display text-[22px] font-bold" placeholder="0" /></label>
        {sp.error && <p className="text-[13px] text-bad">{sp.error}</p>}
        <button className="btn btn-sun w-full py-4 text-[16px]">{t("create.createTrip")}</button>
      </form>
    </div>
  );
}

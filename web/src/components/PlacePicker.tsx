"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

export const PLACE_TYPES = ["restaurant", "activity", "hotel", "shopping", "transport", "saved"] as const;

/** Place select for the activity form, with a "New place" choice that reveals name / type / address fields. */
export function PlacePicker({ places, initial }: { places: { id: string; label: string }[]; initial: string }) {
  const { t } = useT(); const [val, setVal] = useState(initial || (places.length ? "" : "__new"));
  return (
    <div className="flex flex-col gap-2">
      <select name="placeId" value={val} onChange={e => setVal(e.target.value)} className="input">
        <option value="">{t("ui.choosePlace")}</option>
        <option value="__new">{t("ui.newPlace")}</option>
        {places.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      {val === "__new" && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-teal bg-teal-soft/40 p-3">
          <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.placeName")}<input name="newPlaceName" required maxLength={80} className="input" /></label>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.placeType")}<select name="newPlaceType" defaultValue="activity" className="input">{PLACE_TYPES.map(k => <option key={k} value={k}>{t(`ui.placeTypes.${k}`)}</option>)}</select></label>
            <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.placeAddress")}<input name="newPlaceAddress" maxLength={160} className="input" placeholder={t("ui.placeAddressHint")} /></label>
          </div>
          <p className="text-[0.75rem] text-ink-3">{t("ui.placeGeoNote")}</p>
        </div>
      )}
    </div>
  );
}

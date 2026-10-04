"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

export const PLACE_TYPES = ["restaurant", "activity", "hotel", "shopping", "transport", "saved"] as const;

/** Where an activity happens: pick a saved place, add a new one, or just type an address. One address field in every case;
    it feeds the map pin and the Navigate button. */
export function PlacePicker({ places, initial, itemAddress }: { places: { id: string; label: string; address: string | null }[]; initial: string; itemAddress: string }) {
  const { t } = useT(); const [val, setVal] = useState(initial || "");
  const chosen = places.find(p => p.id === val);
  return (
    <div className="flex flex-col gap-2">
      <select name="placeId" value={val} onChange={e => setVal(e.target.value)} className="input">
        <option value="">{t("ui.choosePlace")}</option>
        <option value="__new">{t("ui.newPlace")}</option>
        {places.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      {val === "__new" ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-teal bg-teal-soft/40 p-3">
          <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.placeName")}<input name="newPlaceName" required maxLength={80} className="input" /></label>
          <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.placeType")}<select name="newPlaceType" defaultValue="activity" className="input">{PLACE_TYPES.map(k => <option key={k} value={k}>{t(`ui.placeTypes.${k}`)}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.address")}<input name="newPlaceAddress" maxLength={160} className="input" placeholder={t("ui.placeAddressHint")} /></label>
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-[0.7813rem] font-extrabold text-ink-2">{t("ui.address")}
          <input key={val} id="address" name="address" maxLength={160} defaultValue={chosen ? chosen.address || (val === initial ? itemAddress : "") : itemAddress} className="input" placeholder={t("ui.placeAddressHint")} />
        </label>
      )}
      <p className="text-[0.75rem] text-ink-3">{t("ui.addressHint")}</p>
    </div>
  );
}

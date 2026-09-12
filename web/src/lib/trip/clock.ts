import type { Trip } from "@/lib/supabase/types";

/** The clock the app reasons with. Real time normally; for the seeded demo trip (invite code SYDNEY26) it is pinned
    to Day 4 at 09:10 so the demo always shows something happening. Set ONETRIP_DEMO_CLOCK=off to disable. */
export function demoNow(trip: Trip): Date {
  if (trip.invite_code === "SYDNEY26" && process.env.ONETRIP_DEMO_CLOCK !== "off") {
    const d = new Date(trip.start_date + "T09:10:00"); d.setDate(d.getDate() + 3); return d;
  }
  return new Date();
}

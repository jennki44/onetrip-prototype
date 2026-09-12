import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { loadTrip } from "@/lib/trip/load";

export default async function TripLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) notFound();
  const bundle = await loadTrip(tripId);
  if (!bundle) notFound();
  return <AppShell tripId={tripId}>{children}</AppShell>;
}

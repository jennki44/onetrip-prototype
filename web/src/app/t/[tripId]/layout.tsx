import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";

/** The shell (tab bar, + button) renders straight away so loading.tsx can show while the page fetches the trip.
    Every trip page loads the trip itself and calls notFound() when the caller can't see it. */
export default async function TripLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) notFound();
  return <AppShell tripId={tripId}>{children}</AppShell>;
}

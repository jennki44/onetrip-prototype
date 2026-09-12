import { redirect } from "next/navigation";

export default async function EditItem({ params }: { params: Promise<{ tripId: string; itemId: string }> }) {
  const { tripId, itemId } = await params;
  redirect(`/t/${tripId}/plan/new?edit=${itemId}`);
}

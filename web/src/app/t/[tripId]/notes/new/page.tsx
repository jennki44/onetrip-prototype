import { redirect } from "next/navigation";

/** Old "add a note" address: notes are now added on the 備註 page. */
export default async function NewNote({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; redirect(`/t/${tripId}/notes`);
}

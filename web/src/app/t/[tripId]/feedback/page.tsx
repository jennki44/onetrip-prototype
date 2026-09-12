import { getT } from "@/lib/i18n/server";
import { PageHead } from "@/components/ui";
import { FeedbackForm } from "@/components/FeedbackForm";

export default async function Feedback({ params }: { params: Promise<{ tripId: string }> }) {
  await params; const { t } = await getT();
  return <div className="mx-auto max-w-[560px]"><PageHead title={t("more.feedback")} sub="Three tasks, three questions. Takes about five minutes." /><FeedbackForm /></div>;
}

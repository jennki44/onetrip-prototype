import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getT } from "@/lib/i18n/server";
import { AiPlanner } from "@/components/AiPlanner";

// Planning a whole trip can take a minute; give the server action room.
export const maxDuration = 300;

export default async function AiPlan() {
  const { t } = await getT();
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-16 pt-8">
      <div className="mb-4"><Logo size={36} /></div>
      <Link href="/new" className="btn btn-sm mb-3">‹ {t("common.back")}</Link>
      <h1 className="text-[1.75rem]">✨ {t("ai.planTitle")}</h1><p className="mb-4 text-ink-2">{t("ai.planSub")}</p>
      <AiPlanner />
    </div>
  );
}

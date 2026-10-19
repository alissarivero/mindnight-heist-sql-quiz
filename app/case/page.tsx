import { EvidenceBoard } from "@/components/EvidenceBoard";
import { getProgress, type Progress } from "@/lib/db";
import { QUESTIONS, TOTAL_POINTS } from "@/lib/questions";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CasePage() {
  const user = await currentUser().catch(() => null);
  const progress: Progress = user ? await getProgress(user.id).catch(() => ({})) : {};
  return (
    <EvidenceBoard
      questions={QUESTIONS}
      progress={progress}
      total={TOTAL_POINTS}
      signedIn={!!user}
    />
  );
}

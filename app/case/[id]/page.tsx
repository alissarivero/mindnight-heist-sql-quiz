import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/Workspace";
import { getProgress } from "@/lib/db";
import { QUESTIONS, getQuestion } from "@/lib/questions";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = getQuestion(Number(id));
  if (!question) notFound();

  const user = await currentUser().catch(() => null);
  const progress = user ? await getProgress(user.id).catch(() => ({})) : {};
  const mine = (progress as Awaited<ReturnType<typeof getProgress>>)[question.id];
  const idx = QUESTIONS.findIndex((q) => q.id === question.id);

  return (
    <Workspace
      key={question.id}
      question={question}
      signedIn={!!user}
      initialSql={mine?.lastSql ?? question.starterSql}
      solved={!!mine?.solved}
      prevId={QUESTIONS[idx - 1]?.id ?? null}
      nextId={QUESTIONS[idx + 1]?.id ?? null}
    />
  );
}

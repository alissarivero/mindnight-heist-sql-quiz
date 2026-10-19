import Link from "next/link";
import { Lock } from "lucide-react";
import { Accusation } from "@/components/Accusation";
import { ANSWERS } from "@/lib/answers";
import { getProgress, getSuspects } from "@/lib/db";
import { QUESTIONS, TOTAL_POINTS } from "@/lib/questions";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccusePage() {
  const user = await currentUser().catch(() => null);
  const progress = user ? await getProgress(user.id).catch(() => ({} as Awaited<ReturnType<typeof getProgress>>)) : {};
  const remaining = QUESTIONS.filter((q) => !(progress as Record<number, { solved: boolean }>)[q.id]?.solved);

  if (!user || remaining.length) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 text-center">
        <div>
          <Lock size={40} className="mx-auto mb-4 text-amber" />
          <h1 className="font-display text-3xl">The accusation is sealed</h1>
          <p className="mt-2 text-fog">
            {user ? "Solve every clue before you name the thief. Still open:" : "Sign in and solve every clue before you name the thief."}
          </p>
          {user && (
            <ul className="mt-4 space-y-2">
              {remaining.map((q) => (
                <li key={q.id}>
                  <Link href={`/case/${q.id}`} className="text-amber underline">{q.code}: {q.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={user ? "/case" : "/login?next=/case"} className="btn-amber mt-6">{user ? "Back to the board" : "Sign in"}</Link>
        </div>
      </div>
    );
  }

  const suspects = await getSuspects();
  const culpritName = ANSWERS[5].rows[0][0];
  const minutes = ANSWERS[5].rows[0][1];
  const shaky = new Set(ANSWERS[3].rows.map((r) => r[0]));
  const onCamera = new Set(ANSWERS[4].rows.map((r) => r[0]));
  const present = new Set(ANSWERS[1].rows.map((r) => r[0]));

  return (
    <Accusation
      suspects={suspects.map((s) => ({
        ...s,
        clearedBy: !present.has(s.name) ? "Not in the building" : !shaky.has(s.name) ? "Alibi corroborated" : !onCamera.has(s.name) ? "Not on camera at 00:47" : s.name === culpritName ? null : "Left the vault in 2 minutes",
      }))}
      culprit={culpritName}
      minutes={minutes}
      score={TOTAL_POINTS}
      detective={user.email}
    />
  );
}

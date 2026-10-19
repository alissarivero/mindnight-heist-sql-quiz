import Link from "next/link";
import { ArrowRight, Database, KeyRound, ShieldCheck, Workflow } from "lucide-react";
import { Typewriter } from "@/components/Typewriter";
import { Stamp } from "@/components/Stamp";
import { getSuspects, type Suspect } from "@/lib/db";
import { QUESTIONS, TOTAL_POINTS } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const suspects: Suspect[] = await getSuspects().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-amber">
            Case #0314 · Hollowell Museum
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-paper sm:text-7xl">
            The Midnight <span className="text-amber">Heist</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-fog">
            A $18.5M painting vanished at 00:47. The only witness is a Postgres database. Write SQL against live
            evidence, follow {QUESTIONS.length} clues worth {TOTAL_POINTS} points, and name the thief.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/case" className="btn-amber px-5 py-3 text-base">
              Open the case file <ArrowRight size={18} />
            </Link>
            <a href="#how" className="btn-ghost px-5 py-3 text-base">How it works</a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -top-5 left-6 h-8 w-32 rounded-t-lg bg-paper-2" />
          <div className="paper relative rotate-[1.5deg] rounded-lg p-7 pt-8">
            <div className="flex items-start justify-between border-b border-black/15 pb-3">
              <div className="font-display text-sm uppercase tracking-[0.25em] text-black/60">Incident report</div>
              <div className="font-mono text-xs text-black/50">14-MAR-2026</div>
            </div>
            <Typewriter
              className="mt-4 min-h-[13rem] font-display text-[15px] leading-relaxed"
              lines={[
                "SUBJECT: \"The Azure Heron\" (Moreau, 1891)",
                "LOCATION: Gallery B, 2nd floor",
                "TIME OF THEFT: 00:47",
                "",
                "Ten people had keycards. Every swipe, camera hit, and alibi is logged in the museum database.",
                "",
                "Detective, the data never lies. Find who did it.",
              ]}
            />
            <Stamp text="Confidential" className="absolute -bottom-5 -right-4" rotate={-14} />
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl">The lineup</h2>
          <span className="flex items-center gap-2 font-mono text-xs text-fog">
            <span className={`h-2 w-2 rounded-full ${suspects.length ? "bg-evidence shadow-[0_0_8px] shadow-evidence" : "bg-blood"}`} />
            {suspects.length ? "LIVE · SELECT * FROM heist.suspects" : "database offline"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {suspects.map((s, i) => (
            <div
              key={s.id}
              className="group relative rounded-sm bg-[#f3eee2] p-2 pb-3 text-[#2a241a] shadow-xl transition-transform duration-300 hover:z-10 hover:-translate-y-1 hover:rotate-0"
              style={{ rotate: `${((i * 37) % 7) - 3}deg` }}
            >
              <div className="grid aspect-square place-items-center rounded-sm bg-gradient-to-b from-[#3a352c] to-[#1b1915] text-5xl grayscale-[0.3] group-hover:grayscale-0">
                {s.photo_emoji}
              </div>
              <div className="mt-2 font-display text-sm leading-tight">{s.name}</div>
              <div className="text-[11px] text-black/55">{s.role}</div>
              <div className="mt-1 hidden text-[11px] italic text-blood group-hover:block">Motive: {s.motive}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-20 pb-24">
        <h2 className="mb-6 font-display text-2xl">How the investigation works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: KeyRound, title: "1. Sign in", body: "Supabase Auth. Signed-out visitors can read the briefing but cannot run or save queries." },
            { icon: Database, title: "2. Query live evidence", body: "Your SQL runs on Supabase Postgres as a read-only role inside a rolled-back transaction." },
            { icon: Workflow, title: "3. Submit each clue", body: "Answers are graded by result set, not by text. Order and column names don't matter." },
            { icon: ShieldCheck, title: "4. Every move is logged", body: "A hash-chained, append-only audit log records who ran or saved what. Tampering is detectable." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-5">
              <Icon className="mb-3 text-amber" size={22} />
              <div className="font-semibold">{title}</div>
              <p className="mt-1 text-sm text-fog">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { CheckCircle2, Eye, Link2, Play, Send, ShieldAlert, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { getAuditLog, verifyChain, type AuditRow } from "@/lib/db";
import { currentUser } from "@/lib/supabase/server";
import { getQuestion } from "@/lib/questions";

export const dynamic = "force-dynamic";

const ICONS = { run: Play, save: Send, hint: Eye, explain: Sparkles } as const;

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/New_York" });
}

export default async function CaseLogPage() {
  const user = await currentUser().catch(() => null);
  if (!user) redirect("/login?next=/case-log");

  const [chain, events] = await Promise.all([verifyChain(), getAuditLog({ limit: 150 })]);
  const counts = events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.action]: (acc[e.action] ?? 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-amber">Chain of custody</p>
      <h1 className="font-display text-4xl">Case Log</h1>
      <p className="mt-1 max-w-2xl text-sm text-fog">
        Every run, submission, explain, and hint request is appended to <code className="font-mono text-paper">audit.log</code>. Each entry stores the
        SHA-256 of its contents plus the previous entry&apos;s hash. UPDATE, DELETE, and TRUNCATE are blocked by triggers, and the quiz-taker
        database role has no access to the log at all.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div className={`flex items-center gap-4 rounded-xl border p-5 ${chain.ok ? "border-evidence/40 bg-evidence/[0.07]" : "border-blood/50 bg-blood/10"}`}>
          {chain.ok ? <ShieldCheck size={40} className="text-evidence" /> : <ShieldAlert size={40} className="text-blood" />}
          <div>
            <div className={`font-display text-2xl ${chain.ok ? "text-evidence" : "text-blood"}`}>{chain.ok ? "Chain intact" : "Tampering detected"}</div>
            <div className="text-sm text-fog">
              {chain.ok
                ? `audit.verify_chain() re-hashed all ${chain.totalRows} entries and every link matches.`
                : `Entry #${chain.firstBadId} does not match its recorded hash. Every entry after it is suspect.`}
            </div>
          </div>
        </div>
        <div className="panel grid grid-cols-4 gap-2 p-4 text-center">
          {(["run", "save", "explain", "hint"] as const).map((a) => {
            const Icon = ICONS[a];
            return (
              <div key={a}>
                <Icon size={16} className="mx-auto text-amber" />
                <div className="mt-1 font-display text-2xl">{counts[a] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-fog">{a}</div>
              </div>
            );
          })}
        </div>
      </div>

      <ol className="relative mt-8 border-l border-line pl-6">
        {events.map((e) => <Entry key={e.id} e={e} mine={e.user_email === user.email} />)}
        {!events.length && <p className="text-fog">No activity yet.</p>}
      </ol>
    </div>
  );
}

function Entry({ e, mine }: { e: AuditRow; mine: boolean }) {
  const Icon = ICONS[e.action];
  const q = e.question_id ? getQuestion(e.question_id) : undefined;
  return (
    <li className="relative mb-4">
      <span className="absolute -left-[37px] top-3 grid h-6 w-6 place-items-center rounded-full border border-line bg-ink-2">
        <Icon size={12} className="text-amber" />
      </span>
      <div className={`panel p-3.5 ${mine ? "border-amber/25" : ""}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fog">
          <span className="font-mono text-fog/60">#{e.id}</span>
          <span className="font-semibold uppercase tracking-wider text-paper">{e.action}</span>
          <span className={mine ? "text-amber" : ""}>{e.user_email}{mine ? " (you)" : ""}</span>
          {q && <span>{q.code} · {q.title}</span>}
          {e.row_count != null && <span>{e.row_count} rows</span>}
          {e.action === "save" && (e.is_correct
            ? <span className="flex items-center gap-1 text-evidence"><CheckCircle2 size={12} /> match</span>
            : <span className="flex items-center gap-1 text-blood"><XCircle size={12} /> no match</span>)}
          <span className="ml-auto">{fmt(e.created_at)}</span>
        </div>
        {e.sql_text && <pre className="scrollbar-thin mt-2 max-h-28 overflow-auto rounded-md bg-[#100f0c] p-2 font-mono text-[12px] text-paper/80">{e.sql_text}</pre>}
        <div className="mt-2 flex items-center gap-1.5 overflow-hidden font-mono text-[10px] text-fog/60">
          <Link2 size={10} /> <span title={e.prev_hash}>{e.prev_hash.slice(0, 12)}</span> → <span className="text-fog" title={e.row_hash}>{e.row_hash.slice(0, 12)}</span>
        </div>
      </div>
    </li>
  );
}

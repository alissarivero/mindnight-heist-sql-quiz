"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, FileSearch, GitBranch, History,
  KeyRound, Loader2, Play, Rows3, Send, Sparkles, Undo2, Wand2,
} from "lucide-react";
import type { QueryOutcome, SchemaTable } from "@/lib/db";
import type { GradeResult } from "@/lib/grading";
import type { Question } from "@/lib/questions";
import { formatSql } from "@/lib/formatSql";
import { Prose } from "@/components/Prose";
import { SchemaExplorer } from "./SchemaExplorer";
import { ResultGrid } from "./ResultGrid";
import { PlanTree, type PlanNode } from "./PlanTree";
import { HintVault } from "./HintVault";
import { HistoryList } from "./HistoryList";
import { Verdict } from "./Verdict";
import type { EditorHandle } from "./SqlEditor";

const SqlEditor = dynamic(() => import("./SqlEditor").then((m) => m.SqlEditor), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center font-mono text-xs text-fog">Loading editor…</div>,
});

type Tab = "results" | "plan" | "hint" | "history";
type Busy = null | "run" | "save" | "explain";

type Props = {
  question: Question;
  signedIn: boolean;
  initialSql: string;
  solved: boolean;
  prevId: number | null;
  nextId: number | null;
};

const fireConfetti = () =>
  confetti({ particleCount: 140, spread: 75, origin: { y: 0.65 }, colors: ["#e3a63b", "#f5c46a", "#b8322a", "#ebe2cc", "#4f9d69"] });

export function Workspace({ question, signedIn, initialSql, solved: initiallySolved, prevId, nextId }: Props) {
  const [sql, setSql] = useState(initialSql);
  const [busy, setBusy] = useState<Busy>(null);
  const [tab, setTab] = useState<Tab>("results");
  const [result, setResult] = useState<QueryOutcome | null>(null);
  const [plan, setPlan] = useState<{ Plan: PlanNode } | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [solved, setSolved] = useState(initiallySolved);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(signedIn);
  const [historyKey, setHistoryKey] = useState(0);
  const [errorOffset, setErrorOffset] = useState<number | null>(null);
  const editor = useRef<EditorHandle | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/schema")
      .then((r) => r.json())
      .then((d) => d.ok && setSchema(d.tables))
      .finally(() => setSchemaLoading(false));
  }, [signedIn]);

  const leadingWs = sql.length - sql.trimStart().length;

  const call = useCallback(
    async (kind: Exclude<Busy, null>) => {
      if (!signedIn) {
        toast.error("Sign in to investigate. Signed-out users cannot run or save queries.");
        return;
      }
      if (!sql.trim()) return toast.error("Write a query first.");
      setBusy(kind);
      setErrorOffset(null);
      try {
        const res = await fetch(`/api/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql, questionId: question.id }),
        });
        const data = await res.json();
        if (res.status === 401) throw new Error(data.error);
        if (!res.ok) throw new Error(data.error ?? "Request failed");

        if (kind === "explain") {
          if (data.ok) setPlan(data.plan);
          else {
            setResult(data);
            if (data.position) setErrorOffset(leadingWs + data.position - 1);
          }
          setTab(data.ok ? "plan" : "results");
        } else {
          const outcome: QueryOutcome = kind === "save" ? data.result : data;
          setResult(outcome);
          setTab("results");
          if (!outcome.ok && outcome.position) setErrorOffset(leadingWs + outcome.position - 1);
          if (kind === "save") {
            setGrade(data.grade);
            if (data.saved) {
              if (data.grade?.match) {
                setSolved(true);
                fireConfetti();
                toast.success(`${question.code} solved · +${question.points} points`);
              } else {
                toast("Answer saved. The result doesn't match yet.");
              }
            }
          }
        }
        setHistoryKey((k) => k + 1);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [signedIn, sql, question, leadingWs],
  );

  const tabs: { id: Tab; label: string; icon: typeof Rows3 }[] = [
    { id: "results", label: "Results", icon: Rows3 },
    { id: "plan", label: "Query plan", icon: GitBranch },
    { id: "hint", label: "Hint", icon: KeyRound },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/case" className="btn-ghost py-1.5"><ArrowLeft size={14} /> Board</Link>
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-1 font-mono text-[11px] tracking-widest text-amber">{question.code}</span>
          <h1 className="font-display text-2xl sm:text-3xl">{question.title}</h1>
          <span className="rounded-full bg-ink-3 px-2.5 py-1 text-xs text-fog">{question.points} pts</span>
          {solved && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-evidence/15 px-2.5 py-1 text-xs font-semibold text-evidence">
              <CheckCircle2 size={13} /> Solved
            </motion.span>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          {prevId && <Link href={`/case/${prevId}`} className="btn-ghost py-1.5" aria-label="Previous clue"><ArrowLeft size={14} /></Link>}
          {nextId ? (
            <Link href={`/case/${nextId}`} className={solved ? "btn-amber py-1.5" : "btn-ghost py-1.5"}>Next clue <ArrowRight size={14} /></Link>
          ) : (
            <Link href="/case/accuse" className={solved ? "btn-amber py-1.5" : "btn-ghost py-1.5"}>Accusation <ArrowRight size={14} /></Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="order-2 h-[260px] lg:order-1 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
          <SchemaExplorer schema={schema} loading={schemaLoading} signedIn={signedIn} onInsert={(t) => editor.current?.insert(t)} />
        </aside>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          {/* Brief */}
          <div className="paper relative rounded-lg p-5 pr-6">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">
              <FileSearch size={12} /> Case file · {question.skills.join(" · ")}
            </div>
            <div className="space-y-2 text-[15px] leading-relaxed text-[#221d15]">
              {question.prompt.map((p, i) => (
                <p key={i}><Prose text={p} /></p>
              ))}
            </div>
          </div>

          {!signedIn && (
            <div className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm">
              <AlertTriangle size={16} className="shrink-0 text-amber" />
              <span>You&apos;re signed out. You can draft SQL, but <Link className="font-semibold text-amber underline" href={`/login?next=/case/${question.id}`}>sign in</Link> to run it against the database or save your answer.</span>
            </div>
          )}

          {/* Editor */}
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <button className="btn-amber py-1.5" disabled={!!busy || !signedIn} onClick={() => call("run")} title={signedIn ? "Run (⌘/Ctrl + Enter)" : "Sign in to investigate"}>
                {busy === "run" ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Run
                <span className="kbd border-ink/20 bg-ink/15 text-ink/70">⌘↵</span>
              </button>
              <button className="btn-ghost py-1.5" disabled={!!busy || !signedIn} onClick={() => call("save")} title={signedIn ? "Submit answer (⌘/Ctrl + S)" : "Sign in to investigate"}>
                {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit answer
                <span className="kbd">⌘S</span>
              </button>
              <button className="btn-ghost py-1.5" disabled={!!busy || !signedIn} onClick={() => call("explain")} title="EXPLAIN (⌘/Ctrl + Shift + E)">
                {busy === "explain" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Explain
              </button>
              <div className="ml-auto flex items-center gap-1">
                <button className="rounded-md p-2 text-fog hover:bg-ink-3 hover:text-paper" title="Format SQL" aria-label="Format SQL" onClick={() => editor.current?.setValue(formatSql(sql))}>
                  <Wand2 size={15} />
                </button>
                <button className="rounded-md p-2 text-fog hover:bg-ink-3 hover:text-paper" title="Reset to starter query" aria-label="Reset to starter query" onClick={() => editor.current?.setValue(question.starterSql)}>
                  <Undo2 size={15} />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <SqlEditor
                value={sql}
                onChange={setSql}
                onRun={() => call("run")}
                onSubmit={() => call("save")}
                onExplain={() => call("explain")}
                schema={schema}
                errorOffset={errorOffset}
                handleRef={editor}
              />
            </div>
          </div>

          {grade && <Verdict grade={grade} solvedNote={question.solvedNote} onClose={() => setGrade(null)} />}

          {/* Output tabs */}
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-1 border-b border-line px-2" role="tablist">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition ${tab === id ? "text-paper" : "text-fog hover:text-paper"}`}
                >
                  <Icon size={14} /> {label}
                  {tab === id && <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber" />}
                </button>
              ))}
              {tab === "results" && result?.ok && (
                <div className="ml-auto flex items-center gap-3 pr-2 font-mono text-[11px] text-fog">
                  <span className="flex items-center gap-1"><Rows3 size={12} /> {result.rowCount} row{result.rowCount === 1 ? "" : "s"}{result.truncated ? " (capped)" : ""}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {result.ms} ms</span>
                </div>
              )}
            </div>

            <div className="min-h-[180px]">
              {tab === "results" && <ResultsPane result={result} busy={busy === "run" || busy === "save"} csvName={`heist-q${question.id}`} />}
              {tab === "plan" && (plan ? <PlanTree plan={plan} /> : <Empty icon={GitBranch} text="Click Explain to see how Postgres would execute your query." />)}
              {tab === "hint" && <HintVault questionId={question.id} signedIn={signedIn} onLoadSql={(s) => editor.current?.setValue(s)} />}
              {tab === "history" && (signedIn ? <HistoryList questionId={question.id} refreshKey={historyKey} onRestore={(s) => editor.current?.setValue(s)} /> : <Empty icon={History} text="Sign in to see your query history." />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Rows3; text: string }) {
  return (
    <div className="grid place-items-center p-10 text-center text-sm text-fog">
      <Icon className="mb-2 text-fog/60" /> {text}
    </div>
  );
}

function ResultsPane({ result, busy, csvName }: { result: QueryOutcome | null; busy: boolean; csvName: string }) {
  if (busy) {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-7 animate-pulse rounded bg-ink-3" style={{ opacity: 1 - i * 0.2 }} />)}
      </div>
    );
  }
  if (!result) return <Empty icon={Play} text="Run a query to see rows from the live database." />;
  if (!result.ok) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-4 rounded-lg border border-blood/40 bg-blood/10 p-4">
        <div className="flex items-center gap-2 font-semibold text-blood">
          <AlertTriangle size={16} /> Postgres rejected the query {result.code && <span className="font-mono text-xs opacity-70">SQLSTATE {result.code}</span>}
        </div>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[13px] text-paper/90">{result.error}</pre>
        {result.hint && <p className="mt-2 text-sm text-fog">Hint: {result.hint}</p>}
        {result.code === "25006" && <p className="mt-2 text-sm text-fog">The evidence is read-only. Detectives don&apos;t tamper with evidence.</p>}
      </motion.div>
    );
  }
  return <ResultGrid columns={result.columns} rows={result.rows} csvName={csvName} />;
}

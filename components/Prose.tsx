import { Fragment } from "react";

/** Renders `code` and **bold** spans in question prompts. */
export function Prose({ text, codeClass = "" }: { text: string; codeClass?: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} className={`rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em] ${codeClass}`}>
              {p.slice(1, -1)}
            </code>
          );
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

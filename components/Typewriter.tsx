"use client";

import { useEffect, useState } from "react";

export function Typewriter({ lines, speed = 18, className = "" }: { lines: string[]; speed?: number; className?: string }) {
  const full = lines.join("\n");
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(full.length);
      return;
    }
    const t = setInterval(() => setN((v) => (v >= full.length ? v : v + 1)), speed);
    return () => clearInterval(t);
  }, [full, speed]);

  return (
    <p className={`whitespace-pre-line ${className}`} aria-label={full}>
      <span aria-hidden>{full.slice(0, n)}</span>
      <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[2px] animate-pulse bg-current opacity-70" />
    </p>
  );
}

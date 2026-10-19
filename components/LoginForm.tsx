"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BadgeCheck, Loader2, Mail, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

const TITLES: Record<Mode, string> = {
  signin: "Present your badge",
  signup: "Request a badge",
  magic: "Badge by courier",
};

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = supabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback`;
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Badge verified. Welcome back, detective.");
        router.push(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        if (data.session) {
          toast.success("Badge issued. Get to work, detective.");
          router.push(next);
          router.refresh();
        } else {
          setSent("Check your inbox to confirm your badge, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        setSent("A sign-in link is on its way. Open it on this device.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      className="w-full max-w-md"
    >
      <div className="mx-auto mb-[-14px] h-7 w-16 rounded-t-xl border-x-4 border-t-4 border-fog/50" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-ink-3 to-ink-2 shadow-2xl">
        <div className="flex items-center gap-3 bg-amber px-6 py-3 text-ink">
          <BadgeCheck size={20} />
          <div className="font-display text-sm uppercase tracking-[0.3em]">Hollowell PD · Detective ID</div>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-20 w-16 place-items-center rounded-md border border-line bg-ink text-fog">
              <Fingerprint size={34} />
            </div>
            <div>
              <h1 className="font-display text-2xl">{TITLES[mode]}</h1>
              <p className="text-sm text-fog">Only badge holders may query the evidence.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-evidence/40 bg-evidence/10 p-4 text-sm">
                <Mail className="mb-2 text-evidence" size={18} />
                {sent}
                <button className="mt-3 block text-amber underline" onClick={() => { setSent(null); setMode("signin"); }}>
                  Back to sign in
                </button>
              </motion.div>
            ) : (
              <motion.form key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-widest text-fog">Email</span>
                  <input
                    type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-mono text-sm outline-none transition focus:border-amber"
                    placeholder="detective@duke.edu"
                  />
                </label>
                {mode !== "magic" && (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-widest text-fog">Password</span>
                    <input
                      type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-mono text-sm outline-none transition focus:border-amber"
                      placeholder="••••••••"
                    />
                  </label>
                )}
                <button type="submit" disabled={busy} className="btn-amber w-full py-2.5">
                  {busy && <Loader2 className="animate-spin" size={16} />}
                  {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {!sent && (
            <div className="mt-6 flex justify-between text-sm text-fog">
              {mode !== "signin" ? (
                <button onClick={() => setMode("signin")} className="hover:text-amber">Have a badge? Sign in</button>
              ) : (
                <button onClick={() => setMode("signup")} className="hover:text-amber">New detective? Sign up</button>
              )}
              {mode !== "magic" && (
                <button onClick={() => setMode("magic")} className="hover:text-amber">Magic link</button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-line px-6 py-3 font-mono text-[10px] tracking-widest text-fog/70">
          ID-{"0314".padStart(6, "0")} · SECURED BY SUPABASE AUTH
        </div>
      </div>
    </motion.div>
  );
}

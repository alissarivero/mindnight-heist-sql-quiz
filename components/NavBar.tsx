import Link from "next/link";
import { FolderSearch, ScrollText } from "lucide-react";
import { currentUser } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export async function NavBar() {
  const user = await currentUser().catch(() => null);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-amber/15 text-amber">
            <FolderSearch size={16} />
          </span>
          <span className="font-display text-lg tracking-wide text-paper">The Midnight Heist</span>
        </Link>
        <div className="flex items-center gap-1 text-sm text-fog">
          <Link href="/case" className="rounded-md px-3 py-1.5 hover:bg-ink-3 hover:text-paper">Evidence Board</Link>
          <Link href="/case-log" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-ink-3 hover:text-paper">
            <ScrollText size={14} /> Case Log
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden items-center gap-2 text-fog sm:flex">
                <span className="h-2 w-2 rounded-full bg-evidence shadow-[0_0_8px] shadow-evidence" />
                Det. {user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="btn-amber py-1.5">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

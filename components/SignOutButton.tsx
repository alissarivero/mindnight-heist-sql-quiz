"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="btn-ghost py-1.5"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut size={14} /> Sign out
    </button>
  );
}

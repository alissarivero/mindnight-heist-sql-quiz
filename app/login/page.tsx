import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { currentUser } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/case";
  if (await currentUser().catch(() => null)) redirect(safeNext);
  return (
    <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl place-items-center px-4 py-12">
      <LoginForm next={safeNext} />
    </div>
  );
}

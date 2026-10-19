import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 text-center">
      <div>
        <div className="font-display text-7xl text-amber">404</div>
        <h1 className="mt-2 font-display text-2xl">This file was never in evidence</h1>
        <Link href="/case" className="btn-amber mt-6">Back to the board</Link>
      </div>
    </div>
  );
}

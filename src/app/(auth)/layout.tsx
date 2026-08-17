import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Zeverrock
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold text-zinc-900">Backstage</h1>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

import { testSupabaseConnection } from "@/lib/supabase/test-connection";

const statusStyles: Record<string, string> = {
  ok: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  rls_blocked: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  migration_pending: "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-200",
  key_error: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  config_error: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  error: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
};

export default async function Home() {
  const connection = await testSupabaseConnection();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Backstage
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Festival beheer
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Lokaal testen — Supabase-verbinding (stap 6)
          </p>
        </div>

        <section
          className={`rounded-xl border p-6 ${statusStyles[connection.status] ?? statusStyles.error}`}
        >
          <h2 className="text-lg font-semibold">Supabase status</h2>
          <p className="mt-2">{connection.message}</p>

          {connection.festivals && connection.festivals.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {connection.festivals.map((festival) => (
                <li key={festival.id}>
                  {festival.name} ({festival.year})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Volgende stappen
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Migration nog niet gedraaid? SQL Editor → plak 001_initial_schema.sql</li>
            <li>RLS geblokkeerd? Normaal — login komt in een volgende stap</li>
            <li>Key-fout? Controleer URL + anon key in Supabase → Project Settings → API</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

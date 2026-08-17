import { PageHeader } from "@/components/page-header";
import { navigation } from "@/lib/navigation";
import { testSupabaseConnection } from "@/lib/supabase/test-connection";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rls_blocked: "border-amber-200 bg-amber-50 text-amber-800",
  migration_pending: "border-orange-200 bg-orange-50 text-orange-800",
  key_error: "border-red-200 bg-red-50 text-red-800",
  config_error: "border-red-200 bg-red-50 text-red-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

export default async function DashboardPage() {
  const connection = await testSupabaseConnection();
  const modules = navigation
    .flatMap((section) => section.items)
    .filter((item) => item.href !== "/");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Startpunt van Backstage. Kies een module links of open hieronder een sectie."
      />

      <section
        className={`mb-8 rounded-2xl border px-5 py-4 text-sm ${statusStyles[connection.status] ?? statusStyles.error}`}
      >
        <p className="font-medium">Supabase</p>
        <p className="mt-1">{connection.message}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <h2 className="text-base font-semibold text-zinc-900">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}

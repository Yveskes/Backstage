"use client";

import { PageHeader } from "@/components/page-header";
import { useUsers } from "@/components/users-provider";
import { canManageStaff } from "@/lib/permissions";
import { downloadTshirtCsv, needsTshirt, tshirtCsv, tshirtSizes } from "@/lib/tshirts";
import Link from "next/link";

export default function TshirtListPage() {
  const { users, currentUser } = useUsers();
  const canManage = canManageStaff(currentUser);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang tot de t-shirtlijst.</p>
      </div>
    );
  }

  const rows = users.filter((user) => needsTshirt(user.kind));
  const pending = rows.filter((user) => !user.tshirtConfirmed);
  const counts = tshirtSizes.map((size) => ({
    size,
    count: rows.filter((user) => user.tshirtConfirmed && user.tshirtSize === size).length,
  }));

  return (
    <>
      <p className="text-sm text-zinc-500">
        <Link href="/medewerkers" className="hover:text-zinc-800">
          Medewerkers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">T-shirts</span>
      </p>

      <PageHeader
        title="T-shirtlijst"
        description="Overzicht van bevestigde maten. Trek de lijst voor de bestelling."
        actions={
          <button
            type="button"
            onClick={() => downloadTshirtCsv(tshirtCsv(rows))}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Lijst downloaden
          </button>
        }
      />

      {pending.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          {pending.length} medewerker{pending.length === 1 ? "" : "s"} {pending.length === 1 ? "heeft" : "hebben"} de t-shirtmaat nog niet bevestigd.
        </section>
      ) : (
        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Iedereen heeft de t-shirtmaat bevestigd.
        </section>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((entry) => (
          <div key={entry.size} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{entry.size}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{entry.count}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Naam</th>
              <th className="px-4 py-3 font-medium">Vorig jaar</th>
              <th className="px-4 py-3 font-medium">Dit jaar</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/medewerkers/${user.id}`} className="font-medium text-zinc-900 hover:underline">
                    {user.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{user.tshirtSizeLastYear ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{user.tshirtSize ?? "—"}</td>
                <td className="px-4 py-3">
                  {user.tshirtConfirmed ? (
                    <span className="text-emerald-800">Bevestigd</span>
                  ) : (
                    <span className="text-red-800">Nog niet bevestigd</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

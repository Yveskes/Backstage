"use client";

import { AddStaffForm } from "@/components/add-staff-form";
import { PageHeader } from "@/components/page-header";
import { useUsers } from "@/components/users-provider";
import { canManageStaff, kindLabel, type AppUser } from "@/lib/permissions";
import { formatStaffDays, formatStaffTasks } from "@/lib/staff-tasks";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MedewerkersPage() {
  const { users, currentUser, sessionUser, removeUser } = useUsers();
  const canManage = canManageStaff(currentUser);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang tot medewerkers.</p>
      </div>
    );
  }

  const team = users.filter((user) => user.kind !== "staff");
  const staff = users.filter((user) => user.kind === "staff");

  return (
    <>
      <PageHeader
        title="Medewerkers"
        description="Nodig mensen uit, wijs taken en dagen toe, of verwijder iemand. Alleen admin past teamrechten aan."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/medewerkers/berichten"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Bericht per taak
            </Link>
            <Link
              href="/medewerkers/tshirts"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              T-shirtlijst
            </Link>
          </div>
        }
      />

      <AddStaffForm />

      <UserGroup
        title="Team Zeverrock"
        users={team}
        sessionUserId={sessionUser.id}
        canManage={canManage}
        onRemove={removeUser}
      />
      <div className="mt-8">
        <UserGroup
          title="Medewerkers"
          users={staff}
          sessionUserId={sessionUser.id}
          canManage={canManage}
          onRemove={removeUser}
        />
      </div>
    </>
  );
}

function UserGroup({
  title,
  users,
  sessionUserId,
  canManage,
  onRemove,
}: {
  title: string;
  users: AppUser[];
  sessionUserId: string;
  canManage: boolean;
  onRemove: (id: string) => boolean;
}) {
  const router = useRouter();

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Naam</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Taken</th>
              <th className="px-4 py-3 font-medium">Dag</th>
              <th className="px-4 py-3 font-medium">T-shirt</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const canRemove = canManage && user.id !== sessionUserId && user.kind !== "admin";

              return (
                <tr key={user.id} className="relative border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/medewerkers/${user.id}`}
                      className="font-medium text-zinc-900 after:absolute after:inset-0"
                    >
                      {user.fullName}
                    </Link>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{kindLabel[user.kind]}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.tasks.length > 0 ? formatStaffTasks(user.tasks) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.days ? formatStaffDays(user.days) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {user.tshirtConfirmed ? (
                      <span className="text-emerald-800">{user.tshirtSize}</span>
                    ) : (
                      <span className="text-red-800">Nog niet bevestigd</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canRemove ? (
                      <button
                        type="button"
                        className="relative z-10 text-sm text-red-700 hover:text-red-900"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `${user.fullName} verwijderen? Deze persoon verdwijnt uit de lijst.`,
                          );
                          if (confirmed) {
                            onRemove(user.id);
                            router.refresh();
                          }
                        }}
                      >
                        Verwijderen
                      </button>
                    ) : (
                      <span className="text-zinc-400">Wijzigen</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

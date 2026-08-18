"use client";

import { CrossIcon, CrownIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { canManageStaff, kindLabel, type AppUser } from "@/lib/permissions";
import { leadsForUser } from "@/lib/staff-planning";
import {
  formatStaffTasks,
  formatStaffTasksWithLead,
  formatUserSchedule,
  staffTaskOptions,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

function isBestuur(user: AppUser) {
  return user.kind !== "staff";
}

type ListFilter = "all" | "bestuur" | StaffTaskId;

export default function MedewerkersPage() {
  const { users, currentUser, sessionUser, removeUser } = useUsers();
  const canManage = canManageStaff(currentUser);
  const [filter, setFilter] = useState<ListFilter>("all");

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang tot medewerkers.</p>
      </div>
    );
  }

  const visible = users
    .filter((user) => {
      if (filter === "all") {
        return true;
      }

      if (filter === "bestuur") {
        return isBestuur(user);
      }

      return user.tasks.includes(filter);
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "nl"));

  return (
    <>
      <PageHeader
        title="Medewerkers"
        description="Overzicht van iedereen. Filter op bestuur of post."
        actions={
          <Link
            href="/medewerkers/uitnodigen"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Medewerker uitnodigen
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Alle
        </FilterChip>
        <FilterChip active={filter === "bestuur"} onClick={() => setFilter("bestuur")}>
          <CrownIcon className="h-3.5 w-3.5" />
          Bestuur
        </FilterChip>
        {staffTaskOptions.map((task) => (
          <FilterChip key={task.id} active={filter === task.id} onClick={() => setFilter(task.id)}>
            {task.label}
          </FilterChip>
        ))}
      </div>

      <UserList users={visible} sessionUserId={sessionUser.id} canManage={canManage} onRemove={removeUser} />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${
        active ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function UserList({
  users,
  sessionUserId,
  canManage,
  onRemove,
}: {
  users: AppUser[];
  sessionUserId: string;
  canManage: boolean;
  onRemove: (id: string) => boolean;
}) {
  const router = useRouter();
  const { planning } = useStaffPlanning();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Naam</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Post</th>
            <th className="px-4 py-3 font-medium">Dag</th>
            <th className="px-4 py-3 font-medium">T-shirt</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Acties</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                Niemand in deze filter.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const canRemove = canManage && user.id !== sessionUserId && user.kind !== "admin";
              const leadIds = leadsForUser(planning, user.id);
              const bestuur = isBestuur(user);

              return (
                <tr key={user.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/medewerkers/${user.id}`}
                      className="inline-flex items-center gap-1.5 font-medium text-zinc-900 hover:underline"
                    >
                      {bestuur ? (
                        <CrownIcon className="h-3.5 w-3.5 text-amber-600" />
                      ) : null}
                      {user.fullName || user.email}
                      {leadIds.length > 0 ? " *" : ""}
                    </Link>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                    {leadIds.length > 0 ? (
                      <p className="mt-1 text-xs text-zinc-700">
                        * Verantwoordelijke {formatStaffTasks(leadIds)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{kindLabel[user.kind]}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.tasks.length > 0 ? formatStaffTasksWithLead(user.tasks, leadIds) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{formatUserSchedule(user) || "—"}</td>
                  <td className="px-4 py-3">
                    {user.tshirtConfirmed ? (
                      <span className="text-emerald-800">{user.tshirtSize}</span>
                    ) : (
                      <span className="inline-flex text-red-600" title="Nog niet bevestigd">
                        <CrossIcon className="h-4 w-4" />
                        <span className="sr-only">Nog niet bevestigd</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/medewerkers/${user.id}`}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={`${user.fullName} bewerken`}
                        title="Bewerken"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      {canRemove ? (
                        <button
                          type="button"
                          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700"
                          aria-label={`${user.fullName} verwijderen`}
                          title="Verwijderen"
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
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/page-header";
import { StaffPlanningBoard } from "@/components/staff-planning-board";
import { useUsers } from "@/components/users-provider";
import { canManageStaff } from "@/lib/permissions";
import Link from "next/link";

export default function StaffPlanningPage() {
  const { currentUser } = useUsers();
  const canManage = canManageStaff(currentUser);

  if (!canManage) {
    return (
      <div className="rounded border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang tot de planning.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-500">
        <Link href="/medewerkers" className="hover:text-zinc-800">
          Medewerkers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Planning</span>
      </p>

      <PageHeader title="Planning" />

      <StaffPlanningBoard />
    </>
  );
}

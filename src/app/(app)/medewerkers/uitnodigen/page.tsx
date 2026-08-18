"use client";

import { AddStaffForm } from "@/components/add-staff-form";
import { PageHeader } from "@/components/page-header";
import { useUsers } from "@/components/users-provider";
import { canManageStaff } from "@/lib/permissions";
import Link from "next/link";

export default function InviteStaffPage() {
  const { currentUser } = useUsers();
  const canManage = canManageStaff(currentUser);

  if (!canManage) {
    return (
      <div className="rounded border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang om medewerkers uit te nodigen.</p>
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
        <span className="text-zinc-800">Medewerker uitnodigen</span>
      </p>

      <PageHeader
        title="Medewerker uitnodigen"
        description="Nodig een medewerker of iemand van het team uit. Zij krijgen een link om hun account te activeren."
      />

      <AddStaffForm />
    </>
  );
}

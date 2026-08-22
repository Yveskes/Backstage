"use client";

import { useStaffPlanning } from "@/components/staff-planning-provider";
import { COMBI_HALF_DAYS, rewardForUser } from "@/lib/build-rewards";
import type { AppUser } from "@/lib/permissions";

function helpsWithBuild(user: AppUser) {
  return (
    user.tasks.includes("opbouw") ||
    user.tasks.includes("afbouw") ||
    user.opbouwDays.length > 0 ||
    user.afbouwDays.length > 0
  );
}

export function BuildRewardPills({
  person,
  className = "",
}: {
  person: AppUser;
  className?: string;
}) {
  const { planning } = useStaffPlanning();
  const reward = rewardForUser(planning, person);

  if (person.kind !== "staff" || !helpsWithBuild(person)) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <p className="text-sm font-semibold text-zinc-900">Te ontvangen</p>
      <p
        className={`rounded-[4px] border px-2 py-0.5 text-xs font-medium ${
          reward.tokens > 0
            ? "border-emerald-400 bg-emerald-200 text-emerald-950"
            : "border-red-300 bg-red-50 text-red-800"
        }`}
      >
        {reward.tokens} drankjeton{reward.tokens === 1 ? "" : "s"}
      </p>
      <p
        className={`rounded-[4px] border px-2 py-0.5 text-xs font-medium ${
          reward.combiTicket
            ? "border-emerald-400 bg-emerald-200 text-emerald-950"
            : "border-red-300 bg-red-50 text-red-800"
        }`}
      >
        {reward.combiTicket ? "Combiticket" : `Nog geen combi (${reward.halfDays}/${COMBI_HALF_DAYS})`}
      </p>
    </div>
  );
}

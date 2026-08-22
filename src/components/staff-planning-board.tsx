"use client";

import { useState } from "react";
import { BuildPlanning } from "@/components/build-planning";
import { FestivalPlanning, NewPostForm } from "@/components/festival-planning";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { canManageStaff } from "@/lib/permissions";
import { pillClass } from "@/lib/pills";

export function StaffPlanningBoard() {
  const [tab, setTab] = useState<"build" | "festival">("festival");
  const { addPost } = useStaffPlanning();
  const { currentUser } = useUsers();
  const canManage = canManageStaff(currentUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("festival")}
            className={pillClass(tab === "festival")}
          >
            Festival
          </button>
          <button
            type="button"
            onClick={() => setTab("build")}
            className={pillClass(tab === "build")}
          >
            Opbouw / afbouw
          </button>
        </div>
        {tab === "festival" && canManage ? (
          <NewPostForm onAdd={addPost} />
        ) : null}
      </div>

      {tab === "build" ? <BuildPlanning /> : <FestivalPlanning />}
    </div>
  );
}

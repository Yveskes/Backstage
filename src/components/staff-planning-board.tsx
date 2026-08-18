"use client";

import { useState } from "react";
import { BuildPlanning } from "@/components/build-planning";
import { FestivalPlanning } from "@/components/festival-planning";

export function StaffPlanningBoard() {
  const [tab, setTab] = useState<"build" | "festival">("festival");
  const [leadError, setLeadError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("festival")}
          className={`rounded px-3 py-1.5 text-sm ${
            tab === "festival" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Festival
        </button>
        <button
          type="button"
          onClick={() => setTab("build")}
          className={`rounded px-3 py-1.5 text-sm ${
            tab === "build" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Opbouw / afbouw
        </button>
      </div>

      {leadError ? (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{leadError}</p>
      ) : null}

      {tab === "build" ? (
        <BuildPlanning onLeadError={setLeadError} />
      ) : (
        <FestivalPlanning onLeadError={setLeadError} />
      )}
    </div>
  );
}

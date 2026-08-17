"use client";

import { useUsers } from "@/components/users-provider";
import { useRouter } from "next/navigation";

export function ViewAsBanner() {
  const { currentUser, viewingAsOther, stopViewingAs } = useUsers();
  const router = useRouter();

  if (!viewingAsOther) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p>
          Je bekijkt de app als{" "}
          <span className="font-medium">{currentUser.fullName || currentUser.email}</span>
          {currentUser.kind === "staff" ? " (medewerker)" : ""}.
        </p>
        <button
          type="button"
          onClick={() => {
            stopViewingAs();
            router.push("/");
          }}
          className="rounded-md bg-amber-900 px-3 py-1 text-xs font-medium text-white"
        >
          Terug naar admin
        </button>
      </div>
    </div>
  );
}

"use client";

import { canAccessPath, homePath } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AccessGuard({ children }: { children: ReactNode }) {
  const { currentUser } = useUsers();
  const pathname = usePathname();
  const router = useRouter();
  const allowed = canAccessPath(currentUser, pathname);

  useEffect(() => {
    if (currentUser.kind === "staff" && (pathname === "/" || !allowed)) {
      router.replace(homePath(currentUser));
    }
  }, [allowed, currentUser, pathname, router]);

  if (currentUser.kind === "staff" && (pathname === "/" || !allowed)) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Geen toegang</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Dit onderdeel is niet toegewezen aan {currentUser.fullName}. Een admin
          kan dit aanpassen bij Medewerkers.
        </p>
      </div>
    );
  }

  return children;
}

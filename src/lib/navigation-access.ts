"use client";

import { hasModule, type AppUser } from "@/lib/permissions";
import { navigation, staffNavigation, type NavItem } from "@/lib/navigation";

export function navigationForUser(user: AppUser): NavItem[] {
  if (user.kind === "staff") {
    return staffNavigation;
  }

  const filtered = navigation
    .map((item) => {
      if (!item.module) {
        return item;
      }

      if (!item.children) {
        return hasModule(user, item.module) ? item : null;
      }

      const children = item.children.filter(
        (child) => child.module && hasModule(user, child.module),
      );

      if (children.length === 0) {
        return null;
      }

      return { ...item, children };
    })
    .filter((item): item is NavItem => item !== null);

  return filtered;
}

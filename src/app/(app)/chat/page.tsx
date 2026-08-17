"use client";

import { homePath } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const { currentUser } = useUsers();
  const router = useRouter();

  useEffect(() => {
    router.replace(homePath(currentUser));
  }, [currentUser, router]);

  return null;
}

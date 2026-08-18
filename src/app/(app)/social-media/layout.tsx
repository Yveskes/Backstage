import { SocialProvider } from "@/components/social-provider";
import type { ReactNode } from "react";

export default function SocialMediaLayout({ children }: { children: ReactNode }) {
  return <SocialProvider>{children}</SocialProvider>;
}

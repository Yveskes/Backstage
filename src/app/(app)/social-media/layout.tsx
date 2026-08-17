import { SocialProvider } from "@/components/social-provider";
import { SocialSubnav } from "@/components/social-subnav";
import type { ReactNode } from "react";

export default function SocialMediaLayout({ children }: { children: ReactNode }) {
  return (
    <SocialProvider>
      <SocialSubnav />
      {children}
    </SocialProvider>
  );
}

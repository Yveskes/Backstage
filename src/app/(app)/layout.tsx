import { AccessGuard } from "@/components/access-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { NotificationsProvider } from "@/components/notifications-provider";
import { StaffPlanningProvider } from "@/components/staff-planning-provider";
import { UsersProvider } from "@/components/users-provider";
import { ViewAsBanner } from "@/components/view-as-banner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <UsersProvider>
      <StaffPlanningProvider>
        <NotificationsProvider>
          <div className="min-h-dvh bg-zinc-100">
            <ViewAsBanner />
            <div className="lg:flex">
              <AppSidebar />
              <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-zinc-200/80 bg-zinc-100/90 px-4 backdrop-blur-md sm:px-6 lg:flex lg:px-10">
                  <NotificationsButton />
                </header>
                <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
                  <AccessGuard>{children}</AccessGuard>
                </main>
              </div>
            </div>
          </div>
        </NotificationsProvider>
      </StaffPlanningProvider>
    </UsersProvider>
  );
}

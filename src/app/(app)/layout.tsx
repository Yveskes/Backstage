import { AccessGuard } from "@/components/access-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { NotificationsButton } from "@/components/notifications-button";
import { NotificationsProvider } from "@/components/notifications-provider";
import { UsersProvider } from "@/components/users-provider";
import { ViewAsBanner } from "@/components/view-as-banner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <UsersProvider>
      <NotificationsProvider>
        <div className="min-h-dvh bg-zinc-100">
          <ViewAsBanner />
          <div className="lg:flex">
            <AppSidebar />
            <div className="min-w-0 flex-1 pb-72 lg:pb-0">
              <header className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-zinc-200/80 bg-zinc-100/90 px-4 backdrop-blur-md sm:px-6 lg:flex lg:px-10">
                <NotificationsButton />
              </header>
              <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
                <AccessGuard>{children}</AccessGuard>
              </main>
            </div>
            <div className="hidden w-80 shrink-0 lg:block" aria-hidden="true" />
            <aside
              id="chat"
              className="fixed inset-x-0 bottom-0 z-20 flex h-72 flex-col border-t border-zinc-200 bg-white lg:inset-y-0 lg:right-0 lg:left-auto lg:h-dvh lg:w-80 lg:border-t-0 lg:border-l"
            >
              <ChatPanel />
            </aside>
          </div>
        </div>
      </NotificationsProvider>
    </UsersProvider>
  );
}

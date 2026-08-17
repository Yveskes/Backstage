import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-full bg-zinc-100 lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

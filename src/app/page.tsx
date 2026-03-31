import { ActiveTimer } from "@/components/ActiveTimer";
import { NewTaskInput } from "@/components/NewTaskInput";
import { RecentTasksList } from "@/components/RecentTasksList";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6">
        <ActiveTimer />
        <NewTaskInput />
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent
          </h2>
          <RecentTasksList />
        </section>
      </main>
    </div>
  );
}

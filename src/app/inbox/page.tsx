"use client";

import { Mail } from "@/features/mail-app/components/mail";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { TaskEntity } from "@/entities/task";

export default function InboxPage() {
  // Use default values for static export compatibility
  const defaultLayout = [20, 32, 48];
  const defaultCollapsed = false;
  const { data: tasks } = useFirestoreCollection<TaskEntity>("tasks");

  return (
    <div className="h-screen rounded-md border bg-background text-foreground">
      <Mail
        tasks={tasks}
        defaultLayout={defaultLayout}
        defaultCollapsed={defaultCollapsed}
        navCollapsedSize={4}
      />
    </div>
  );
}

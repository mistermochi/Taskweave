import { useMemo } from "react";
import { startOfToday, startOfTomorrow, addDays } from "date-fns";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useReferenceContext } from "@/context/ReferenceContext";
import { useTaskAppStore } from "../use-task-app";
import { TaskListItem } from "./task-list-item";

import { ScrollArea } from "@/shared/ui/ui/scroll-area";
import { Skeleton } from "@/shared/ui/ui/skeleton";

interface TaskListProps {
  items: Task[];
  tags: Tag[];
  loading?: boolean;
}

type GroupedTasks = {
    label: string;
    tasks: Task[];
};

const ENERGY_MAP: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

export function TaskList({ items, tags, loading = false }: TaskListProps) {
  const selectedTaskId = useTaskAppStore((state) => state.selectedTask?.id);
  const setSelectedTask = useTaskAppStore((state) => state.setSelectedTask);
  const { tagsMap } = useReferenceContext();

  const groups = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const upcoming: Task[] = [];
    const later: Task[] = [];

    // Bolt ⚡ Optimization: Pre-calculate date boundaries once to avoid redundant
    // expensive calls to `isToday`, `isTomorrow`, etc., within the iteration loop.
    // This is DST-safe by using `date-fns` for boundary calculation.
    const todayStart = startOfToday().getTime();
    const todayEnd = startOfTomorrow().getTime();
    const tomorrowEnd = addDays(todayEnd, 1).getTime();

    items.forEach(task => {
        if (task.status === 'completed') {
            later.push(task);
            return;
        }

        // Bolt ⚡ Optimization: Direct numeric comparisons on timestamps.
        // If dueDate/assignedDate is missing (0/undefined), it naturally falls through to 'later'.
        const dueDate = Number(task.dueDate) || 0;
        const assignedDate = Number(task.assignedDate) || 0;

        if (dueDate > 0 && dueDate < todayStart) {
            overdue.push(task);
        } else if (
            (dueDate > 0 && dueDate < todayEnd) ||
            (assignedDate > 0 && assignedDate < todayEnd)
        ) {
            today.push(task);
        } else if (
            (dueDate > 0 && dueDate < tomorrowEnd) ||
            (assignedDate > 0 && assignedDate < tomorrowEnd)
        ) {
            tomorrow.push(task);
        } else if (
            (dueDate >= tomorrowEnd) ||
            (assignedDate >= tomorrowEnd)
        ) {
            upcoming.push(task);
        } else {
            later.push(task);
        }
    });

    const sortToday = (a: Task, b: Task) => {
        if (a.isFocused && !b.isFocused) return -1;
        if (!a.isFocused && b.isFocused) return 1;
        const aTime = a.assignedDate || a.dueDate || Infinity;
        const bTime = b.assignedDate || b.dueDate || Infinity;
        if (aTime !== bTime) return aTime - bTime;
        const energyDiff = (ENERGY_MAP[b.energy] || 2) - (ENERGY_MAP[a.energy] || 2);
        if (energyDiff !== 0) return energyDiff;
        return (a.createdAt || 0) - (b.createdAt || 0);
    };

    const sortOverdue = (a: Task, b: Task) => (a.dueDate || 0) - (b.dueDate || 0);

    const sortInbox = (a: Task, b: Task) => {
        const durationDiff = a.duration - b.duration;
        if (durationDiff !== 0) return durationDiff;
        return b.createdAt - a.createdAt;
    };

    const result: GroupedTasks[] = [];
    if (overdue.length) result.push({ label: "Overdue", tasks: overdue.sort(sortOverdue) });
    if (today.length) result.push({ label: "Today", tasks: today.sort(sortToday) });
    if (tomorrow.length) result.push({ label: "Tomorrow", tasks: tomorrow.sort(sortToday) });
    if (upcoming.length) result.push({ label: "Upcoming", tasks: upcoming.sort(sortToday) });
    if (later.length) {
        const label = items[0]?.status === 'completed' ? "Completed" : "Later";
        result.push({
            label,
            tasks: label === "Completed" ? later.sort((a,b) => (b.completedAt || 0) - (a.completedAt || 0)) : later.sort(sortInbox)
        });
    }

    return result;
  }, [items]);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {loading && items.length === 0 && (
          <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded-lg border border-transparent">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div className="text-muted-foreground sticky top-0 bg-background/95 z-10 py-2 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                {group.label}
            </div>
            {group.tasks.map((item) => (
              <TaskListItem
                key={item.id}
                task={item}
                tagsMap={tagsMap}
                isSelected={selectedTaskId === item.id}
                onClick={setSelectedTask}
              />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

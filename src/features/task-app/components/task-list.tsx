import { useMemo } from "react";
import { isToday, isPast, isTomorrow, startOfToday } from "date-fns";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useTaskAppStore } from "../use-task-app";
import { TaskListItem } from "./task-list-item";

import { ScrollArea } from "@/shared/ui/ui/scroll-area";

interface TaskListProps {
  items: Task[];
  tags: Tag[];
}

type GroupedTasks = {
    label: string;
    tasks: Task[];
};

const ENERGY_MAP: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

export function TaskList({ items, tags }: TaskListProps) {
  const selectedTaskId = useTaskAppStore((state) => state.selectedTask?.id);
  const setSelectedTask = useTaskAppStore((state) => state.setSelectedTask);

  const tagsMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {} as Record<string, Tag>);
  }, [tags]);

  const groups = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const upcoming: Task[] = [];
    const later: Task[] = [];

    const now = startOfToday();

    items.forEach(task => {
        if (task.status === 'completed') {
            later.push(task);
            return;
        }

        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const assignedDate = task.assignedDate ? new Date(task.assignedDate) : null;

        if (dueDate && isPast(dueDate) && !isToday(dueDate)) {
            overdue.push(task);
        } else if (
            (dueDate && isToday(dueDate)) ||
            (assignedDate && (isToday(assignedDate) || isPast(assignedDate)))
        ) {
            today.push(task);
        } else if ((dueDate && isTomorrow(dueDate)) || (assignedDate && isTomorrow(assignedDate))) {
            tomorrow.push(task);
        } else if ((dueDate && dueDate > now) || (assignedDate && assignedDate > now)) {
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

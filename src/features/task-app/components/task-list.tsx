import { ComponentProps, useMemo } from "react";
import { isToday, isPast, isTomorrow, startOfToday } from "date-fns";
import {
  Calendar,
  Clock,
  Tag as TagIcon,
  Zap,
  Repeat,
  Layers
} from "lucide-react";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useTaskAppStore } from "../use-task-app";
import { cn } from "@/shared/lib/utils";
import { formatRecurrence } from "@/shared/lib/timeUtils";

import { Badge } from "@/shared/ui/ui/badge";
import { ScrollArea } from "@/shared/ui/ui/scroll-area";

interface TaskListProps {
  items: Task[];
  tags: Tag[];
}

type GroupedTasks = {
    label: string;
    tasks: Task[];
};

export function TaskList({ items, tags }: TaskListProps) {
  const { selectedTask, setSelectedTask } = useTaskAppStore();

  const getTagInfo = (categoryId: string) => {
    const tag = tags.find(t => t.id === categoryId);
    if (tag) return { name: tag.name, color: tag.color };
    return { name: categoryId, color: undefined };
  };

  const groups = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const upcoming: Task[] = [];
    const later: Task[] = [];

    const now = startOfToday();

    items.forEach(task => {
        const date = task.dueDate || task.assignedDate || task.createdAt;
        const taskDate = new Date(date);

        if (task.status === 'completed') {
            later.push(task);
        } else if (isPast(taskDate) && !isToday(taskDate)) {
            overdue.push(task);
        } else if (isToday(taskDate)) {
            today.push(task);
        } else if (isTomorrow(taskDate)) {
            tomorrow.push(task);
        } else if (taskDate > now) {
            upcoming.push(task);
        } else {
            later.push(task);
        }
    });

    const energyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

    const sortToday = (a: Task, b: Task) => {
        if (a.isFocused && !b.isFocused) return -1;
        if (!a.isFocused && b.isFocused) return 1;
        const aTime = a.assignedDate || a.dueDate || Infinity;
        const bTime = b.assignedDate || b.dueDate || Infinity;
        if (aTime !== bTime) return aTime - bTime;
        const energyDiff = (energyMap[b.energy] || 2) - (energyMap[a.energy] || 2);
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
              <button
                key={item.id}
                className={cn(
                  "hover:bg-accent/70 flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                  selectedTask?.id === item.id && "bg-accent/70"
                )}
                onClick={() => setSelectedTask(item)}>
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold line-clamp-1">{item.title}</div>
                      {item.energy === 'High' && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                </div>
                {item.notes && (
                    <div className="text-muted-foreground line-clamp-2 text-xs">
                    {item.notes.substring(0, 300)}
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {item.category && (() => {
                    const info = getTagInfo(item.category);
                    return (
                        <Badge
                            variant="secondary"
                            className="flex items-center gap-1 text-[10px] px-1.5 py-0"
                            style={info.color ? { backgroundColor: `${info.color}33`, color: info.color, borderColor: `${info.color}66` } : {}}
                        >
                            <TagIcon className="h-3 w-3" />
                            {info.name}
                        </Badge>
                    );
                  })()}
                  {item.duration > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0">
                      <Clock className="h-3 w-3" />
                      {item.duration}m
                    </Badge>
                  )}
                  {item.energy && (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-500">
                      <Zap className="h-3 w-3" />
                      {item.energy}
                    </Badge>
                  )}
                  {item.assignedDate && (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-400">
                      <Clock className="h-3 w-3" />
                      {new Date(item.assignedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                  {item.dueDate && (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-red-500/30 text-red-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                  {item.recurrence && (
                      <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400">
                        <Repeat className="h-3 w-3" />
                        {formatRecurrence(item.recurrence)}
                      </Badge>
                  )}
                  {item.blockedBy?.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-500">
                        <Layers className="h-3 w-3" />
                        {item.blockedBy.length}
                      </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

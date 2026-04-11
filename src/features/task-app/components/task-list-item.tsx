import * as React from "react";
import {
  Calendar,
  CalendarClock,
  Clock,
  Tag as TagIcon,
  Zap,
  Repeat,
  Layers
} from "lucide-react";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { cn, vibrate } from "@/shared/lib/utils";
import { formatRecurrence } from "@/shared/lib/timeUtils";
import { Badge } from "@/shared/ui/ui/badge";

interface TaskListItemProps {
  task: Task;
  categoryTag?: Tag;
  isSelected?: boolean;
  onClick: (task: Task) => void;
}

export const TaskListItem = React.memo(({ task, categoryTag, isSelected, onClick }: TaskListItemProps) => {
  const itemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const tagInfo = React.useMemo(() => {
    if (categoryTag) return { name: categoryTag.name, color: categoryTag.color };
    if (task.category) return { name: task.category, color: undefined };
    return null;
  }, [categoryTag, task.category]);

  const isInactive = task.status === 'completed' || task.status === 'archived';

  return (
    <button
      ref={itemRef}
      type="button"
      className={cn(
        "hover:bg-accent/70 flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected && "bg-accent/70",
        isInactive && "grayscale opacity-70"
      )}
      aria-pressed={isSelected ? "true" : "false"}
      onClick={() => {
        vibrate('light');
        onClick(task);
      }}>
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "font-semibold line-clamp-1",
                isInactive && "line-through"
              )}
              title={task.title}
            >
              <span className="sr-only">Task: </span>
              {task.title}
            </div>
            {task.energy === 'High' && <span className="flex h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />}
          </div>
        </div>
      </div>
      {task.notes && (
        <div className="text-muted-foreground line-clamp-2 text-xs">
          {task.notes.substring(0, 300)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {tagInfo && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-[10px] px-1.5 py-0"
            style={tagInfo.color ? { backgroundColor: `${tagInfo.color}33`, color: tagInfo.color, borderColor: `${tagInfo.color}66` } : {}}
          >
            <TagIcon className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Project: </span>
            {tagInfo.name}
          </Badge>
        )}
        {task.duration > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Duration: </span>
            {task.duration}m
          </Badge>
        )}
        {task.energy && (
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 text-[10px] px-1.5 py-0",
              task.energy === 'High' ? "text-orange-500 border-orange-500/30" :
              task.energy === 'Low' ? "text-emerald-500 border-emerald-500/30" :
              "text-yellow-500 border-yellow-500/30"
            )}
          >
            <Zap className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Energy: </span>
            {task.energy}
          </Badge>
        )}
        {task.assignedDate && (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-400">
            <CalendarClock className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Scheduled: </span>
            {new Date(task.assignedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Badge>
        )}
        {task.dueDate && (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-red-500/30 text-red-500">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Due: </span>
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Badge>
        )}
        {task.recurrence && (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Repeats: </span>
            {formatRecurrence(task.recurrence, task.dueDate ? new Date(task.dueDate) : undefined)}
          </Badge>
        )}
        {task.blockedBy?.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-500">
            <Layers className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Blocked by: </span>
            {task.blockedBy.length}
          </Badge>
        )}
      </div>
    </button>
  );
});

TaskListItem.displayName = "TaskListItem";

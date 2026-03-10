import React, { useEffect } from "react";
import { useTaskAppStore } from "../use-task-app";
import { Task } from "@/entities/task";
import { Tag as TagEntity } from "@/entities/tag";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TaskDetailView } from "./task-detail-view";

interface TaskDetailProps {
  task: Task | null;
  tags: TagEntity[];
  allTasks: Task[];
}

export function TaskDetail({ task, tags, allTasks }: TaskDetailProps) {
  const [open, setOpen] = React.useState(false);
  const { selectedTask, setSelectedTask } = useTaskAppStore();

  useEffect(() => {
    if (selectedTask) {
      setOpen(true);
    } else {
        setOpen(false);
    }
  }, [selectedTask]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
        setSelectedTask(null);
    }
  };

  return (
    <>
      {/* Desktop Detail View */}
      <div className="hidden md:block h-full border-l">
        <TaskDetailView
          task={task}
          tags={tags}
          allTasks={allTasks}
        />
      </div>

      {/* Mobile Popup Sheet Detail View */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="right" className="w-[90%] sm:max-w-md overflow-y-auto">
            <VisuallyHidden>
              <SheetHeader>
                <SheetTitle>Task Display</SheetTitle>
              </SheetHeader>
            </VisuallyHidden>
            <TaskDetailView
              task={task}
              tags={tags}
              allTasks={allTasks}
              onClose={() => handleOpenChange(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

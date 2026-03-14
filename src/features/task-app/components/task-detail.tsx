import React, { useEffect } from "react";
import { useTaskAppStore } from "../use-task-app";
import { Task } from "@/entities/task";
import { Tag as TagEntity } from "@/entities/tag";
import { Drawer, DrawerContent } from "@/shared/ui/ui/drawer";
import { DialogHeader, DialogTitle } from "@/shared/ui/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TaskDetailView } from "./task-detail-view";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface TaskDetailProps {
  task: Task | null;
  tags: TagEntity[];
  allTasks: Task[];
}

export function TaskDetail({ task, tags, allTasks }: TaskDetailProps) {
  const [open, setOpen] = React.useState(false);
  const { selectedTask, setSelectedTask } = useTaskAppStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (selectedTask && isMobile) {
      setOpen(true);
    } else {
        setOpen(false);
    }
  }, [selectedTask, isMobile]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
        // When closing on mobile, we should navigate back to the list view in the URL
        // while preserving search query.
        setSelectedTask(null);
    }
  };

  if (isMobile) {
    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent>
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>Task Display</DialogTitle>
              </DialogHeader>
            </VisuallyHidden>
            <TaskDetailView
              task={task}
              tags={tags}
              allTasks={allTasks}
              onClose={() => handleOpenChange(false)}
            />
          </DrawerContent>
        </Drawer>
    );
  }

  return (
    <div className="h-full border-l">
      <TaskDetailView
        task={task}
        tags={tags}
        allTasks={allTasks}
      />
    </div>
  );
}

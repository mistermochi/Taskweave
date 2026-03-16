"use client";

import * as React from "react";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/ui/sheet";
import { Button } from "@/shared/ui/ui/button";
import { DialogHeader, DialogTitle } from "@/shared/ui/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tag } from "@/entities/tag";
import { Task } from "@/entities/task";
import { TaskNavigationContent } from "./task-navigation-content";

interface TaskNavigationProps {
  tags: Tag[];
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapsed?: (collapsed: boolean) => void;
  hasPendingWrites?: boolean;
  tagsLoading?: boolean;
}

export function TaskNavigation({
  tags,
  tasks,
  isCollapsed,
  onToggleCollapsed,
  hasPendingWrites = false,
  tagsLoading = false,
}: TaskNavigationProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-col h-full">
        <TaskNavigationContent
          isCollapsed={isCollapsed}
          tags={tags}
          tasks={tasks}
          onToggleCollapsed={onToggleCollapsed}
          hasPendingWrites={hasPendingWrites}
          tagsLoading={tagsLoading}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 [&>button:first-of-type]:hidden" onClick={() => setOpen(false)}>
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>Navigation</DialogTitle>
              </DialogHeader>
            </VisuallyHidden>
            <TaskNavigationContent
              isCollapsed={false}
              tags={tags}
              tasks={tasks}
              hasPendingWrites={hasPendingWrites}
              tagsLoading={tagsLoading}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

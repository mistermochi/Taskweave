"use client";

import * as React from "react";
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  PanelLeft,
  Send,
  Settings,
  Trash2,
} from "lucide-react";

import { Nav } from "./nav";
import { Button } from "@/shared/ui/ui/button";
import { useTaskAppStore } from "../use-task-app";
import { Separator } from "@/shared/ui/ui/separator";
import { cn } from "@/shared/lib/utils";
import { AccountSwitcher } from "./account-switcher";
import { Tag } from "@/entities/tag";
import { Task } from "@/entities/task";
import { TaskTagTree } from "./task-tag-tree";

const accounts = [
  {
    label: "Personal Tasks",
    email: "personal@taskweave.app",
    icon: <Inbox className="size-4" />,
  }
];

interface TaskNavigationContentProps {
  isCollapsed: boolean;
  tags: Tag[];
  tasks: Task[];
  onToggleCollapsed?: (collapsed: boolean) => void;
}

export function TaskNavigationContent({
  isCollapsed,
  tags,
  tasks,
  onToggleCollapsed,
}: TaskNavigationContentProps) {
  // BOLT: Use a selector for setIsCollapsed to avoid unnecessary re-renders
  // when other store state (like selectedTask) changes.
  const setIsCollapsed = useTaskAppStore((state) => state.setIsCollapsed);

  const handleToggle = (collapsed: boolean) => {
    if (onToggleCollapsed) {
      onToggleCollapsed(collapsed);
    } else {
      setIsCollapsed(collapsed);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex h-[52px] items-center",
          isCollapsed ? "justify-center" : "justify-between px-2"
        )}>
        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleToggle(true)}
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleToggle(false)}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Separator />

      <Nav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Inbox",
            label: tasks.filter(t => t.status === 'active').length.toString(),
            icon: Inbox,
            variant: "default"
          },
          {
            title: "Drafts",
            label: "",
            icon: File,
            variant: "ghost"
          },
          {
            title: "Sent",
            label: "",
            icon: Send,
            variant: "ghost"
          },
          {
            title: "Junk",
            label: "",
            icon: ArchiveX,
            variant: "ghost"
          },
          {
            title: "Trash",
            label: "",
            icon: Trash2,
            variant: "ghost"
          },
          {
            title: "Archive",
            label: "",
            icon: Archive,
            variant: "ghost"
          },
          {
            title: "Settings",
            label: "",
            icon: Settings,
            variant: "ghost"
          }
        ]}
      />

      <Separator />

      <TaskTagTree isCollapsed={isCollapsed} tags={tags} tasks={tasks} />
    </>
  );
}

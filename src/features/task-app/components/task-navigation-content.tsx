"use client";

import * as React from "react";
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  Send,
  Settings,
  Trash2,
} from "lucide-react";

import { Nav } from "./nav";
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
}

export function TaskNavigationContent({ isCollapsed, tags, tasks }: TaskNavigationContentProps) {
  return (
    <>
      <div
        className={cn(
          "flex h-[52px] items-center justify-center",
          isCollapsed ? "h-[52px]" : "px-0"
        )}>
        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
      </div>

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

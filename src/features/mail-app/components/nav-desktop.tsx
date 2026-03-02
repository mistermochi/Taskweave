"use client";

import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Send,
  ShoppingCart,
  Trash2,
  Users2
} from "lucide-react";

import { Nav } from "./nav";
import { Separator } from "@/shared/ui/ui/separator";
import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { AccountSwitcher } from "./account-switcher";
import { Tag } from "@/entities/tag";
import { Task } from "@/entities/task";
import { MailTagTree } from "./mail-tag-tree";

const accounts = [
  {
    label: "Personal Tasks",
    email: "personal@taskweave.app",
    icon: <Inbox className="size-4" />,
  }
];

interface NavDesktopProps {
  isCollapsed: boolean;
  tags: Tag[];
  tasks: Task[];
}

export function NavDesktop({ isCollapsed, tags, tasks }: NavDesktopProps) {
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
            label: "128",
            icon: Inbox,
            variant: "default"
          },
          {
            title: "Drafts",
            label: "9",
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
            label: "23",
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
          }
        ]}
      />

      <Separator />

      <MailTagTree isCollapsed={isCollapsed} tags={tags} tasks={tasks} />
    </>
  );
}

"use client";

import * as React from "react";
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  MenuIcon,
  Send,
  Trash2,
} from "lucide-react";

import { Nav } from "./nav";
import { Separator } from "@/shared/ui/ui/separator";
import { AccountSwitcher } from "./account-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/ui/sheet";
import { Button } from "@/shared/ui/ui/button";
import { DialogHeader, DialogTitle } from "@/shared/ui/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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

interface NavMobileProps {
  tags: Tag[];
  tasks: Task[];
}

export function NavMobile({ tags, tasks }: NavMobileProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-auto [&>button:first-of-type]:hidden">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Navigation</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-[52px] items-center justify-center px-2">
          <AccountSwitcher isCollapsed={false} accounts={accounts} />
        </div>

        <Separator />

        <Nav
          isCollapsed={false}
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
            }
          ]}
        />

        <Separator />

        <TaskTagTree isCollapsed={false} tags={tags} tasks={tasks} />
      </SheetContent>
    </Sheet>
  );
}

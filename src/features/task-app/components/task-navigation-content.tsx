"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  BarChart3,
  Settings,
  PanelLeft,
  Inbox
} from "lucide-react";

import { Nav } from "./nav";
import { Button } from "@/shared/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { useTaskAppStore } from "../use-task-app";
import { Separator } from "@/shared/ui/ui/separator";
import { cn } from "@/shared/lib/utils";
import { AccountSwitcher } from "./account-switcher";
import { Tag } from "@/entities/tag";
import { Task } from "@/entities/task";
import { TaskTagTree } from "./task-tag-tree";
import { ScrollArea } from "@/shared/ui/ui/scroll-area";

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
  const { setIsCollapsed } = useTaskAppStore();

  const handleToggle = (collapsed: boolean) => {
    if (onToggleCollapsed) {
      onToggleCollapsed(collapsed);
    } else {
      setIsCollapsed(collapsed);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className={cn(
          "flex h-[52px] items-center shrink-0",
          isCollapsed ? "justify-center" : "justify-between px-2"
        )}>
        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
        {!isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggle(true)}
                aria-label="Collapse sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggle(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      <Separator className="shrink-0" />

      <ScrollArea className="flex-1">
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: "Dashboard",
              icon: LayoutDashboard,
              variant: "ghost"
            },
            {
              title: "Tasks",
              label: tasks.filter(t => t.status === 'active').length.toString(),
              icon: CheckCircle2,
              variant: "default"
            },
            {
              title: "Insights",
              icon: BarChart3,
              variant: "ghost"
            },
            {
              title: "Settings",
              icon: Settings,
              variant: "ghost"
            }
          ]}
        />

        <Separator />

        <TaskTagTree isCollapsed={isCollapsed} tags={tags} tasks={tasks} />
      </ScrollArea>
    </div>
  );
}

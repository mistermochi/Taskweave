"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  BarChart3,
  Settings,
  PanelLeft,
  Inbox,
  Wifi,
  WifiOff,
  CloudUpload
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
  hasPendingWrites?: boolean;
}

export function TaskNavigationContent({
  isCollapsed,
  tags,
  tasks,
  onToggleCollapsed,
  hasPendingWrites = false,
}: TaskNavigationContentProps) {
  const { setIsCollapsed } = useTaskAppStore();
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

      <div className={cn(
        "mt-auto border-t p-2 flex flex-col gap-1",
        isCollapsed ? "items-center" : "items-stretch"
      )}>
        {hasPendingWrites && !isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-orange-500 font-medium bg-orange-500/10 rounded-md mb-1 animate-pulse">
            <CloudUpload className="h-3 w-3" />
            <span>Changes pending</span>
          </div>
        )}

        {hasPendingWrites && isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-8 w-8 text-orange-500 bg-orange-500/10 rounded-md mb-1 animate-pulse">
                <CloudUpload className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Changes pending</TooltipContent>
          </Tooltip>
        )}

        <div className={cn(
          "flex items-center text-[10px] text-muted-foreground",
          isCollapsed ? "justify-center" : "justify-between px-2"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-emerald-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-rose-500" />
              )}
              <span className={cn(isOnline ? "text-emerald-500/80" : "text-rose-500/80")}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          )}

          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: isOnline ? '#10b981' : '#f43f5e' }} />
              </TooltipTrigger>
              <TooltipContent side="right">
                {isOnline ? "Online" : "Offline"}
              </TooltipContent>
            </Tooltip>
          )}

          {!isCollapsed && <span>v0.1.0</span>}
        </div>
      </div>
    </div>
  );
}

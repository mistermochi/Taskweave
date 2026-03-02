"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

import { Input } from "@/shared/ui/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/ui/resizable";
import { Separator } from "@/shared/ui/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/ui/tabs";
import { TooltipProvider } from "@/shared/ui/ui/tooltip";
import { TaskDisplay } from "./task-display";
import { TaskList } from "./task-list";
import { SettingsView } from "@/features/settings";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useTaskAppStore } from "../use-task-app";
import { NavDesktop } from "./nav-desktop";
import { NavMobile } from "./nav-mobile";
import { TaskDisplayMobile } from "./task-display-mobile";

interface TaskAppProps {
  tasks: Task[];
  tags: Tag[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function TaskApp({
  tasks,
  tags,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize
}: TaskAppProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const isMobile = useIsMobile();
  const { selectedTask, selectedTagId, showSettings, setShowSettings } = useTaskAppStore();
  const [tab, setTab] = React.useState("active");

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
        // Status filter
        if (tab === "active" && task.status !== "active") return false;
        if (tab === "completed" && task.status !== "completed") return false;
        if (tab === "archived" && task.status !== "archived") return false;

        // Tag filter
        if (selectedTagId) {
            const tag = tags.find(t => t.id === selectedTagId);
            if (!tag) return false;
            if (task.category !== tag.id && task.category !== tag.name) return false;
        }

        return true;
    });
  }, [tasks, tab, selectedTagId, tags]);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="items-stretch"
        onLayoutChanged={(layout) => {
          document.cookie = `react-resizable-panels:layout:task=${JSON.stringify(layout)}`;
        }}
      >
        {!isMobile && (
          <>
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              collapsedSize={navCollapsedSize}
              collapsible={true}
              minSize={15}
              maxSize={20}
              onResize={(size) => {
                const isNowCollapsed = size.asPercentage <= navCollapsedSize;
                setIsCollapsed(isNowCollapsed);
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(isNowCollapsed)}`;
              }}
              className={cn(
                "flex flex-col h-full",
                isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
              )}
            >
              <NavDesktop isCollapsed={isCollapsed} tags={tags} tasks={tasks} />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          {showSettings ? (
            <SettingsView />
          ) : (
            <Tabs
              defaultValue="all"
              className="flex h-full flex-col gap-0"
              onValueChange={(value) => setTab(value)}>
              <div className="flex items-center px-4 py-2">
                <div className="flex items-center gap-2">
                  {isMobile && <NavMobile tags={tags} tasks={tasks} />}
                  <h1 className="text-xl font-bold">Inbox</h1>
                </div>
                <TabsList className="ml-auto">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </div>
              <Separator />
              <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
                <form>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input placeholder="Search" className="pl-8" />
                  </div>
                </form>
              </div>
              <div className="min-h-0">
                <TaskList
                  items={filteredTasks}
                  tags={tags}
                />
              </div>
            </Tabs>
          )}
        </ResizablePanel>
        {!isMobile && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
              <TaskDisplay
                task={tasks.find((item) => item.id === selectedTask?.id) || null}
                tags={tags}
              />
            </ResizablePanel>
          </>
        )}
        {isMobile && (
          <TaskDisplayMobile
            task={tasks.find((item) => item.id === selectedTask?.id) || null}
            tags={tags}
          />
        )}
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}

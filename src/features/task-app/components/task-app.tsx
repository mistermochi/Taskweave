"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

import { Input } from "@/shared/ui/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/ui/resizable";
import { Separator } from "@/shared/ui/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { Button } from "@/shared/ui/ui/button";
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
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesNotes = task.notes?.toLowerCase().includes(query) || false;
            if (!matchesTitle && !matchesNotes) return false;
        }

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
  }, [tasks, tab, selectedTagId, tags, searchQuery]);

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
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="relative">
          {showSettings ? (
            <SettingsView />
          ) : (
            <div className="relative h-full flex flex-col">
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
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                        placeholder="Search"
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>
              <div className="min-h-0 flex-1">
                <TaskList
                  items={filteredTasks}
                  tags={tags}
                />
              </div>
            </Tabs>
            <div className="absolute bottom-6 right-6">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-lg"
                            onClick={() => useTaskAppStore.getState().setSelectedTask({
                                id: "new",
                                title: "",
                                status: "active",
                                category: "",
                                energy: "Medium",
                                duration: 0,
                                createdAt: Date.now(),
                                blockedBy: []
                            } as Task)}
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Create Task</TooltipContent>
                </Tooltip>
            </div>
            </div>
          )}
        </ResizablePanel>
        {!isMobile && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
              <TaskDisplay
                task={selectedTask?.id === "new" ? selectedTask : (tasks.find((item) => item.id === selectedTask?.id) || null)}
                tags={tags}
                allTasks={tasks}
              />
            </ResizablePanel>
          </>
        )}
        {isMobile && (
          <TaskDisplayMobile
            task={selectedTask?.id === "new" ? selectedTask : (tasks.find((item) => item.id === selectedTask?.id) || null)}
            tags={tags}
            allTasks={tasks}
          />
        )}
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}

"use client";

import * as React from "react";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

import { Input } from "@/shared/ui/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/ui/ui/resizable";
import { Separator } from "@/shared/ui/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/ui/tabs";
import { TooltipProvider } from "@/shared/ui/ui/tooltip";
import { Button } from "@/shared/ui/ui/button";
import { Fab } from "@/shared/ui/ui/fab";
import { EmptyState } from "@/shared/ui/ui/Feedback";
import { Toaster } from "@/shared/ui/ui/sonner";
import { TaskList } from "./task-list";
import { SettingsView } from "@/features/settings";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useTaskAppStore } from "../use-task-app";
import { TaskNavigation } from "./task-navigation";
import { TaskDetail } from "./task-detail";
import { useIsMobile } from "@/shared/hooks/use-mobile";

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
  navCollapsedSize,
}: TaskAppProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const { selectedTask, selectedTagId, showSettings } = useTaskAppStore();
  const [tab, setTab] = React.useState("active");
  const [searchQuery, setSearchQuery] = React.useState("");
  const isMobile = useIsMobile();

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
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
        const tag = tags.find((t) => t.id === selectedTagId);
        if (!tag) return false;
        if (task.category !== tag.id && task.category !== tag.name)
          return false;
      }

      return true;
    });
  }, [tasks, tab, selectedTagId, tags, searchQuery]);

  const taskDetail = (
    <TaskDetail
      task={
        selectedTask?.id === "new"
          ? selectedTask
          : tasks.find((item) => item.id === selectedTask?.id) || null
      }
      tags={tags}
      allTasks={tasks}
    />
  );

  const mainContent = (
    <div className="relative h-full flex flex-col w-full">
      <Tabs
        defaultValue="active"
        className="flex h-full flex-col gap-0"
        onValueChange={(value) => setTab(value)}
      >
        <div className="flex items-center px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />
            </div>
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
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="pl-9 pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          </form>
        </div>
        <div className="min-h-0 flex-1">
          {filteredTasks.length > 0 ? (
            <TaskList items={filteredTasks} tags={tags} />
          ) : (
            <EmptyState
              icon={Search}
              title={searchQuery ? "No results found" : `No ${tab} tasks`}
              message={
                searchQuery
                  ? `We couldn't find any tasks matching "${searchQuery}".`
                  : `You don't have any tasks in your ${tab} list yet.`
              }
              action={
                searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )
              }
            />
          )}
        </div>
      </Tabs>
      <Fab
        icon={<Plus />}
        label="Create Task"
        tooltip="Create Task"
        onClick={() =>
          useTaskAppStore.getState().setSelectedTask({
            id: "new",
            title: "",
            status: "active",
            category: "",
            energy: "Medium",
            duration: 0,
            createdAt: Date.now(),
            blockedBy: [],
          } as Task)
        }
      />
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Toaster />
      {!isMobile ? (
        /* Desktop Layout */
        <div className="flex h-full w-full">
          <ResizablePanelGroup
            orientation="horizontal"
            className="items-stretch"
            onLayoutChanged={(layout) => {
              document.cookie = `react-resizable-panels:layout:task=${JSON.stringify(layout)}`;
            }}
          >
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
                isCollapsed &&
                  "min-w-[50px] transition-all duration-300 ease-in-out",
              )}
            >
              <TaskNavigation
                isCollapsed={isCollapsed}
                tags={tags}
                tasks={tasks}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={defaultLayout[1]}
              minSize={30}
              className="relative"
            >
              {showSettings ? <SettingsView /> : mainContent}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
              {taskDetail}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        /* Mobile Layout */
        <div className="flex h-full w-full flex-col overflow-hidden">
          {showSettings ? <SettingsView /> : mainContent}
          {taskDetail}
        </div>
      )}
    </TooltipProvider>
  );
}

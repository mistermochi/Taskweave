"use client";

import * as React from "react";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

import { Input } from "@/shared/ui/ui/input";
import { Separator } from "@/shared/ui/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/ui/ui/tooltip";
import { Button } from "@/shared/ui/ui/button";
import { Fab } from "@/shared/ui/ui/fab";
import { EmptyState } from "@/shared/ui/ui/Feedback";
import { Toaster } from "@/shared/ui/ui/sonner";
import { AppHeader } from "@/shared/ui/ui/app-header";
import { TaskList } from "./task-list";
import { SettingsView } from "@/features/settings";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { InsightsView } from "@/features/insights";
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
  const {
    selectedTask,
    selectedTagId,
    activeView,
    isCollapsed,
    setIsCollapsed,
  } = useTaskAppStore();

  React.useEffect(() => {
    if (defaultCollapsed !== undefined) {
      setIsCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed, setIsCollapsed]);

  const toggleCollapsed = React.useCallback(
    (collapsed: boolean) => {
      setIsCollapsed(collapsed);
      document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(collapsed)}; path=/; max-age=31536000`;
    },
    [setIsCollapsed]
  );
  const [tab, setTab] = React.useState("active");
  const [searchQuery, setSearchQuery] = React.useState("");
  const isMobile = useIsMobile();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const createNewTask = React.useCallback(() => {
    useTaskAppStore.getState().setSelectedTask({
      id: "new",
      title: "",
      status: "active",
      category: "",
      energy: "Medium",
      duration: 0,
      createdAt: Date.now(),
      blockedBy: [],
    } as Task);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName);

      // Focus search on '/'
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Create new task on 'n'
      if (e.key === "n" && !isInputFocused) {
        e.preventDefault();
        createNewTask();
      }

      // Clear search and blur on 'Escape'
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewTask]);

  const filteredTasks = React.useMemo(() => {
    const selectedTag = selectedTagId
      ? tags.find((t) => t.id === selectedTagId)
      : null;

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
        if (!selectedTag) return false;
        if (
          task.category !== selectedTag.id &&
          task.category !== selectedTag.name
        )
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
        <AppHeader
          title="Inbox"
          nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
          actions={
            <TabsList className="ml-auto">
              <TabsTrigger
                value="active"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Archived
              </TabsTrigger>
            </TabsList>
          }
        />
        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={isMobile ? "Search tasks..." : "Search tasks... (/)"}
                aria-label="Search tasks"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8 hover:bg-transparent"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear search (Esc)</TooltipContent>
                </Tooltip>
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
        tooltip="Create Task (n)"
        position={isMobile ? "fixed" : "absolute"}
        onClick={createNewTask}
      />
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Toaster />
      {!isMobile ? (
        /* Desktop Layout */
        <div className="flex h-full w-full overflow-hidden">
          <aside
            className={cn(
              "flex h-full flex-col border-r transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[52px]" : "w-[240px]"
            )}
          >
            <TaskNavigation
              isCollapsed={isCollapsed}
              tags={tags}
              tasks={tasks}
              onToggleCollapsed={toggleCollapsed}
            />
          </aside>
          {activeView === 'tasks' ? (
            <>
              <div className="flex h-full w-[400px] flex-col border-r">
                {mainContent}
              </div>
              <main className="flex h-full flex-1 flex-col min-w-0">
                {taskDetail}
              </main>
            </>
          ) : (
            <>
              <main className="flex h-full flex-1 flex-col min-w-0">
                {activeView === 'settings' && <SettingsView />}
                {activeView === 'dashboard' && <DashboardView />}
                {activeView === 'insights' && <InsightsView onNavigate={() => {}} />}
              </main>
              {activeView === 'dashboard' && <aside className="flex h-full flex-1 flex-col min-w-0 border-l">{taskDetail}</aside>}
            </>
          )}
        </div>
      ) : (
        /* Mobile Layout */
        <div className="flex h-full w-full flex-col overflow-hidden">
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'tasks' && mainContent}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'insights' && <InsightsView onNavigate={() => {}} />}
          {taskDetail}
        </div>
      )}
    </TooltipProvider>
  );
}

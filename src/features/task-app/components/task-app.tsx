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
import { EmptyState } from "@/shared/ui/ui/empty-state";
import { Toaster } from "@/shared/ui/ui/sonner";
import { toast } from "sonner";
import { AppHeader } from "@/shared/ui/ui/app-header";
import { FocusPlayer } from "@/features/focus-session/FocusPlayer";
import { SessionSummaryModal } from "@/features/complete-task";
import { TaskList } from "./task-list";
import { SettingsView } from "@/features/settings";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { InsightsView } from "@/features/insights";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { useTaskAppStore, TaskTab } from "../use-task-app";
import { TaskNavigation } from "./task-navigation";
import { TaskDetail } from "./task-detail";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useHashRouter } from "../lib/use-hash-router";
import { useNavigation } from "@/context/NavigationContext";
import { useTaskContext } from "@/context/TaskContext";
import { useReferenceContext } from "@/context/ReferenceContext";
import { createDefaultTask } from "../lib/constants";
import { parseTaskInput } from "@/shared/lib/textParserUtils";

interface TaskAppProps {
  tasks: Task[];
  tags: Tag[];
  tasksLoading?: boolean;
  tagsLoading?: boolean;
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  hasPendingWrites?: boolean;
}

export function TaskApp({
  tasks,
  tags,
  tasksLoading = false,
  tagsLoading = false,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
  hasPendingWrites = false,
}: TaskAppProps) {
  const {
    summaryTaskId,
    hideSummary,
    activeTaskId,
    focusOnTask,
    clearFocusSession,
  } = useNavigation();

  const selectedTask = useTaskAppStore((state) => state.selectedTask);
  const selectedTagId = useTaskAppStore((state) => state.selectedTagId);
  const activeView = useTaskAppStore((state) => state.activeView);
  const taskTab = useTaskAppStore((state) => state.taskTab);
  const setTaskTab = useTaskAppStore((state) => state.setTaskTab);
  const searchQuery = useTaskAppStore((state) => state.searchQuery);
  const setSearchQuery = useTaskAppStore((state) => state.setSearchQuery);
  const isCollapsed = useTaskAppStore((state) => state.isCollapsed);
  const setIsCollapsed = useTaskAppStore((state) => state.setIsCollapsed);
  const optimisticTasks = useTaskAppStore((state) => state.optimisticTasks);
  const clearOptimisticTask = useTaskAppStore((state) => state.clearOptimisticTask);
  const optimisticTags = useTaskAppStore((state) => state.optimisticTags);
  const clearOptimisticTag = useTaskAppStore((state) => state.clearOptimisticTag);

  const { tasksMap } = useTaskContext();
  const { tagsMap } = useReferenceContext();

  // Reconciliation: Clear optimistic state when Firestore data catches up
  React.useEffect(() => {
    Object.entries(optimisticTasks).forEach(([id, optimistic]) => {
      const actual = tasksMap[id];
      if (optimistic === null) {
        // Optimistic delete: clear if gone from Firestore
        if (!actual) clearOptimisticTask(id);
      } else if (actual) {
        // Optimistic update or add: clear if actual exists and is at least as new
        if (actual.updatedAt >= (optimistic.updatedAt || 0)) {
           clearOptimisticTask(id);
        }
      }
    });
  }, [tasksMap, optimisticTasks, clearOptimisticTask]);

  React.useEffect(() => {
    Object.entries(optimisticTags).forEach(([id, optimistic]) => {
      const actual = tagsMap[id];
      if (optimistic === null) {
        if (!actual) clearOptimisticTag(id);
      } else if (actual) {
        if (actual.name === optimistic.name) {
           clearOptimisticTag(id);
        }
      }
    });
  }, [tagsMap, optimisticTags, clearOptimisticTag]);

  // Bolt ⚡ Optimization: Consolidate task merging, status partitioning, and lookup map generation into a single O(N) pass.
  const {
    mergedTasks,
    mergedTasksMap,
    activeTasks,
    completedTasks,
    archivedTasks,
    activeTasksCount,
    focusedTask
  } = React.useMemo(() => {
    const taskMap = new Map<string, Task>();
    tasks.forEach(t => taskMap.set(t.id, t));

    Object.entries(optimisticTasks).forEach(([id, update]) => {
      if (update === null) {
        taskMap.delete(id);
      } else {
        const existing = taskMap.get(id);
        if (existing) {
          taskMap.set(id, { ...existing, ...update } as Task);
        } else {
          taskMap.set(id, update as Task);
        }
      }
    });

    const allMerged: Task[] = [];
    const active: Task[] = [];
    const completed: Task[] = [];
    const archived: Task[] = [];
    let focused: Task | undefined;

    taskMap.forEach(task => {
      allMerged.push(task);
      if (task.status === 'active') {
        active.push(task);
        if (task.isFocused && !focused) {
          focused = task;
        }
      } else if (task.status === 'completed') {
        completed.push(task);
      } else if (task.status === 'archived') {
        archived.push(task);
      }
    });

    return {
      mergedTasks: allMerged,
      mergedTasksMap: taskMap,
      activeTasks: active,
      completedTasks: completed,
      archivedTasks: archived,
      activeTasksCount: active.length,
      focusedTask: focused
    };
  }, [tasks, optimisticTasks]);

  // Bolt ⚡ Optimization: Consolidate tag merging and lookup map generation into a single O(T) pass.
  const { mergedTags, mergedTagsMap, mergedTagsByName } = React.useMemo(() => {
    const tagMap = new Map<string, Tag>(tags.map(t => [t.id, t]));

    Object.entries(optimisticTags).forEach(([id, update]) => {
      if (update === null) {
        tagMap.delete(id);
      } else {
        const existing = tagMap.get(id);
        if (existing) {
          tagMap.set(id, { ...existing, ...update });
        } else {
          tagMap.set(id, update as Tag);
        }
      }
    });

    const allMerged = Array.from(tagMap.values());
    const idMap: Record<string, Tag> = {};
    const nameMap: Record<string, Tag> = {};

    allMerged.forEach(tag => {
      idMap[tag.id] = tag;
      nameMap[tag.name.toLowerCase()] = tag;
    });

    return {
      mergedTags: allMerged,
      mergedTagsMap: idMap,
      mergedTagsByName: nameMap
    };
  }, [tags, optimisticTags]);

  useHashRouter(mergedTasksMap);

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();

          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    toast("A new version is available", {
                      description: "Update to get the latest features.",
                      action: {
                        label: "Refresh",
                        onClick: () => {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                          window.location.reload();
                        },
                      },
                      duration: Infinity,
                    });
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error("Service worker update detection failed:", error);
        }
      };

      registerSW();
    }
  }, []);

  React.useEffect(() => {
    if (!activeTaskId && focusedTask) {
      focusOnTask(focusedTask.id);
    }
  }, [focusedTask, activeTaskId, focusOnTask]);

  React.useEffect(() => {
    // Bolt ⚡ Optimization: Use O(1) map lookup.
    // Guard with size > 0 to avoid clearing session during initial data load.
    if (activeTaskId && mergedTasksMap.size > 0) {
      const task = mergedTasksMap.get(activeTaskId);
      if (!task || task.status !== 'active') {
        clearFocusSession();
      }
    }
  }, [activeTaskId, mergedTasksMap, clearFocusSession]);

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
  const isMobile = useIsMobile();
  const activeViewRef = React.useRef(activeView);

  // Keep ref in sync
  React.useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const createNewTask = React.useCallback(() => {
    useTaskAppStore.getState().setSelectedTask(createDefaultTask());
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName);

      // Focus search on '/'
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        if (activeViewRef.current !== 'tasks') {
            window.location.hash = '#/tasks';
        }
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      // Create new task on 'n'
      if (e.key === "n" && !isInputFocused) {
        e.preventDefault();
        window.location.hash = `#/${activeViewRef.current}/new`;
      }

      // Clear search and blur on 'Escape'
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewTask, setSearchQuery]);

  const filteredTasks = React.useMemo(() => {
    // Bolt ⚡: Hoist search parsing and only execute if query exists
    const parsedSearch = searchQuery ? parseTaskInput(searchQuery) : null;
    const tagKeyword = parsedSearch?.attributes.tagKeyword;
    const searchTitle = parsedSearch?.cleanTitle.toLowerCase();
    const lowerTagKeyword = tagKeyword?.toLowerCase();

    const selectedTag = selectedTagId
      ? mergedTagsMap[selectedTagId]
      : null;

    const matchedTag = lowerTagKeyword
      ? mergedTagsByName[lowerTagKeyword] // Bolt ⚡: O(1) lookup from specialized map
      : null;

    const sourceTasks =
      taskTab === 'active' ? activeTasks :
      taskTab === 'done' ? completedTasks :
      taskTab === 'archived' ? archivedTasks :
      mergedTasks;

    return sourceTasks.filter((task) => {
      // Bolt ⚡: For robustness, if we fell back to mergedTasks,
      // we must still apply status filtering.
      if (sourceTasks === mergedTasks) {
        if (taskTab === "active" && task.status !== "active") return false;
        if (taskTab === "done" && task.status !== "completed") return false;
        if (taskTab === "archived" && task.status !== "archived") return false;
      }

      // Search filter
      if (searchQuery) {
          // If there's a tag keyword, task must match it
          if (tagKeyword) {
              const tagIdMatch = matchedTag ? task.category === matchedTag.id : false;
              const tagNameMatch = task.category.toLowerCase() === lowerTagKeyword;
              if (!tagIdMatch && !tagNameMatch) return false;
          }

          // If there's clean text search, task must match it in title or notes
          if (searchTitle) {
              const matchesTitle = task.title.toLowerCase().includes(searchTitle);
              const matchesNotes = task.notes?.toLowerCase().includes(searchTitle) || false;
              if (!matchesTitle && !matchesNotes) return false;
          }
      }

      // Legacy Tag filter (still used by some parts of the app possibly)
      if (selectedTagId && !tagKeyword) {
        if (!selectedTag) return false;
        if (
          task.category !== selectedTag.id &&
          task.category !== selectedTag.name
        )
          return false;
      }

      return true;
    });
  }, [activeTasks, completedTasks, archivedTasks, mergedTasks, taskTab, selectedTagId, mergedTagsMap, mergedTagsByName, searchQuery]);

  const taskDetail = React.useMemo(() => (
    <TaskDetail
      task={
        selectedTask?.id === "new"
          ? selectedTask
          : (selectedTask?.id ? mergedTasksMap.get(selectedTask.id) : null) || null
      }
      tags={mergedTags}
      allTasks={mergedTasks}
    />
  ), [selectedTask, mergedTasks, mergedTasksMap, mergedTags]);

  const mainContent = (
    <div className="relative h-full flex flex-col w-full">
      <Tabs
        value={taskTab}
        className="flex h-full flex-col gap-0"
        onValueChange={(value) => setTaskTab(value as TaskTab)}
      >
        <AppHeader
          title="Inbox"
          nav={<TaskNavigation tags={mergedTags} tasks={activeTasks} isCollapsed={false} />}
          actions={
            <TabsList className="ml-auto">
              <TabsTrigger
                value="active"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="done"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Done
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
          {filteredTasks.length > 0 || tasksLoading ? (
            <TaskList items={filteredTasks} tags={mergedTags} loading={tasksLoading} />
          ) : (
            <EmptyState
              icon={Search}
              title={searchQuery ? "No results found" : `No ${taskTab} tasks`}
              message={
                searchQuery
                  ? `We couldn't find any tasks matching "${searchQuery}".`
                  : `You don't have any tasks in your ${taskTab} list yet.`
              }
              action={
                searchQuery ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                ) : taskTab === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewTask}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskTab("active")}
                  >
                    View Active Tasks
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

  const isFocusActive = !!activeTaskId && mergedTasksMap.get(activeTaskId)?.status === 'active';

  return (
    <TooltipProvider delayDuration={0}>
      <Toaster position={isMobile ? "top-center" : "bottom-right"} offset={isFocusActive ? 96 : 16} />
      <FocusPlayer />
      <SessionSummaryModal taskId={summaryTaskId} onClose={hideSummary} />
      <div className={cn(
        "flex h-full w-full overflow-hidden transition-[padding] duration-300",
        isFocusActive ? "pb-20" : "pb-0"
      )}>
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
              tags={mergedTags}
              tasks={activeTasks}
              onToggleCollapsed={toggleCollapsed}
              hasPendingWrites={hasPendingWrites}
              tagsLoading={tagsLoading}
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
              <main className={cn(
                "flex h-full flex-col min-w-0",
                activeView === 'dashboard' ? "w-[400px] border-r" : "flex-1"
              )}>
                {activeView === 'settings' && <SettingsView />}
                {activeView === 'dashboard' && <DashboardView />}
                {activeView === 'insights' && <InsightsView onNavigate={() => {}} />}
              </main>
              {activeView === 'dashboard' && <aside className="flex h-full flex-1 flex-col min-w-0">{taskDetail}</aside>}
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
          <div className="md:hidden">
            <TaskNavigation
              isCollapsed={false}
              tags={mergedTags}
              tasks={activeTasks}
              hasPendingWrites={hasPendingWrites}
              tagsLoading={tagsLoading}
            />
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

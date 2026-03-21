import { useState, useEffect, useMemo, useRef } from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import {
  Archive,
  ArchiveX,
  Calendar as CalendarIcon,
  CalendarClock,
  Check,
  Clock,
  Layers,
  Loader2,
  MoreVertical,
  MousePointerClick,
  Plus,
  Repeat,
  Save,
  Share,
  Tag,
  Trash2,
  Undo2,
  Zap,
  X,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/ui/dropdown-menu";
import { Badge } from "@/shared/ui/ui/badge";
import { Button } from "@/shared/ui/ui/button";
import { Calendar } from "@/shared/ui/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/shared/ui/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/ui/popover";
import { Separator } from "@/shared/ui/ui/separator";
import { AutoResizeTextarea } from "@/shared/ui/ui/auto-resize-textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/ui/tooltip";
import { Task, taskApi, EnergyLevel, RecurrenceConfig } from "@/entities/task";
import { Tag as TagEntity, tagApi } from "@/entities/tag";
import { useNavigation } from "@/context/NavigationContext";
import { useTaskAppStore } from "../use-task-app";
import { parseTaskInput, ParsedTaskInput } from "@/shared/lib/textParserUtils";
import { formatRecurrence } from "@/shared/lib/timeUtils";

import { TagPicker } from "@/components/pickers/TagPicker";
import { EnergyPicker } from "@/components/pickers/EnergyPicker";
import { DurationPicker } from "@/components/pickers/DurationPicker";
import { DatePicker } from "@/components/pickers/DatePicker";
import { RecurrencePicker as RecurrenceInlinePicker } from "@/components/pickers/RecurrencePicker";

interface TaskDetailViewProps {
  task: Task | null;
  tags: TagEntity[];
  allTasks: Task[];
  onClose?: () => void;
}

export function TaskDetailView({
  task,
  tags,
  allTasks,
  onClose,
}: TaskDetailViewProps) {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const today = new Date();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const [localCategory, setLocalCategory] = useState<string | undefined>();
  const [localEnergy, setLocalEnergy] = useState<EnergyLevel | undefined>();
  const [localDuration, setLocalDuration] = useState<number | undefined>();
  const [localAssignedDate, setLocalAssignedDate] = useState<
    number | undefined
  >();
  const [localDueDate, setLocalDueDate] = useState<number | undefined>();
  const [localRecurrence, setLocalRecurrence] = useState<
    RecurrenceConfig | undefined
  >();

  const [lastParsedAttributes, setLastParsedAttributes] = useState<
    ParsedTaskInput["attributes"]
  >({});

  const navigation = useNavigation();
  const setTaskTab = useTaskAppStore((state) => state.setTaskTab);

  const isReadOnly = task?.status === "completed" || task?.status === "archived";

  const getTagInfo = (categoryId: string | undefined) => {
    if (!categoryId) return null;
    const tag = tags.find((t) => t.id === categoryId);
    if (tag) return { name: tag.name, color: tag.color };
    return { name: categoryId, color: undefined };
  };

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
      setLocalCategory(task.category);
      setLocalEnergy(task.energy);
      setLocalDuration(task.duration);
      setLocalAssignedDate(task.assignedDate || undefined);
      setLocalDueDate(task.dueDate || undefined);
      setLocalRecurrence(task.recurrence || undefined);
    } else {
      setTitle("");
      setNotes("");
      setLocalCategory(undefined);
      setLocalEnergy(undefined);
      setLocalDuration(undefined);
      setLocalAssignedDate(undefined);
      setLocalDueDate(undefined);
      setLocalRecurrence(undefined);
    }
    setLastParsedAttributes({});
  }, [task]);

  const parsed = useMemo(() => {
    return parseTaskInput(title);
  }, [title]);

  useEffect(() => {
    const { attributes } = parsed;

    if (attributes.tagKeyword !== lastParsedAttributes.tagKeyword) {
      if (attributes.tagKeyword) {
        const matchedTag = tags.find(
          (t) => t.name.toLowerCase() === attributes.tagKeyword?.toLowerCase(),
        );
        if (matchedTag) {
          setLocalCategory(matchedTag.id);
        } else {
          setLocalCategory(attributes.tagKeyword);
        }
      } else {
        setLocalCategory(undefined);
      }
    }
    if (attributes.energy !== lastParsedAttributes.energy) {
      setLocalEnergy(attributes.energy);
    }
    if (attributes.duration !== lastParsedAttributes.duration) {
      setLocalDuration(attributes.duration);
    }
    if (attributes.assignedDate !== lastParsedAttributes.assignedDate) {
      setLocalAssignedDate(attributes.assignedDate);
    }
    if (attributes.dueDate !== lastParsedAttributes.dueDate) {
      setLocalDueDate(attributes.dueDate);
    }
    if (attributes.recurrence !== lastParsedAttributes.recurrence) {
      setLocalRecurrence(attributes.recurrence);
    }

    setLastParsedAttributes(attributes);
  }, [parsed, lastParsedAttributes, tags]);

  const handleToggleComplete = async () => {
    if (!task || task.id === "new") return;
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    const onError = () => {
      useTaskAppStore.getState().showToast("Sync failed. Action reverted.");
      useTaskAppStore.getState().clearOptimisticTask(task.id);
    };

    try {
      if (task.status === "completed") {
        useTaskAppStore.getState().setOptimisticTask(task.id, { status: "active", completedAt: null, updatedAt: Date.now() });
        taskApi.uncompleteTask(task.id, onError);
        useTaskAppStore.getState().showToast(isOffline ? "Task reactivated locally" : "Task reactivated");
      } else {
        // Optimistically update status and navigate
        const completedAt = Date.now();
        useTaskAppStore.getState().setOptimisticTask(task.id, { status: "completed", completedAt, updatedAt: completedAt });

        // Use 0 as default actual duration if not specified
        taskApi.completeTask(task, 0, allTasks); // Note: completeTask eventually calls completeTaskAndRespawn which doesn't take onError yet in my current taskApi but it should

        // Navigate away from the task and go to Done tab
        useTaskAppStore.getState().setSelectedTask(null);
        setTaskTab('done');

        onClose?.();
        useTaskAppStore.getState().showToast(isOffline ? "Task completed locally" : "Task completed", () => {
          useTaskAppStore.getState().setOptimisticTask(task.id, { status: "active", completedAt: null, updatedAt: Date.now() });
          taskApi.uncompleteTask(task.id, onError);
        });
      }
    } catch (e) {
      console.error("Failed to toggle task completion", e);
      useTaskAppStore.getState().showToast("Action failed");
    }
  };

  useEffect(() => {
    if (!showDeleteConfirm) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        deleteButtonRef.current &&
        !deleteButtonRef.current.contains(event.target as Node)
      ) {
        setShowDeleteConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteConfirm]);

  const handleToggleArchive = async () => {
    if (!task || task.id === "new") return;
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    const onError = () => {
      useTaskAppStore.getState().showToast("Sync failed. Action reverted.");
      useTaskAppStore.getState().clearOptimisticTask(task.id);
    };

    try {
      if (task.status === "archived") {
        useTaskAppStore.getState().setOptimisticTask(task.id, { status: "active", archivedAt: null, updatedAt: Date.now() });
        taskApi.unarchiveTask(task.id);
        useTaskAppStore.getState().showToast(isOffline ? "Task restored locally" : "Task restored");
      } else {
        const archivedAt = Date.now();
        useTaskAppStore.getState().setOptimisticTask(task.id, { status: "archived", archivedAt, updatedAt: archivedAt });
        taskApi.archiveTask(task.id);

        // Navigate away from the task and go to Archived tab
        useTaskAppStore.getState().setSelectedTask(null);
        setTaskTab('archived');

        onClose?.();
        useTaskAppStore.getState().showToast(isOffline ? "Task archived locally" : "Task archived", () => {
          useTaskAppStore.getState().setOptimisticTask(task.id, { status: "active", archivedAt: null, updatedAt: Date.now() });
          taskApi.unarchiveTask(task.id);
        });
      }
    } catch (e) {
      console.error("Failed to toggle archive", e);
      useTaskAppStore.getState().showToast("Action failed");
    }
  };

  const handleDelete = async () => {
    if (!task || task.id === "new") return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      useTaskAppStore.getState().showToast("Click again to permanently delete this task");
      return;
    }

    const onError = () => {
      useTaskAppStore.getState().showToast("Delete failed. Task restored.");
      useTaskAppStore.getState().clearOptimisticTask(task.id);
    };

    try {
      useTaskAppStore.getState().setOptimisticTask(task.id, null);
      taskApi.deleteTask(task.id, onError);
      useTaskAppStore.getState().setSelectedTask(null);
      onClose?.();
      useTaskAppStore.getState().showToast("Task deleted");
    } catch (e) {
      console.error("Failed to delete task", e);
      useTaskAppStore.getState().showToast("Action failed");
    }
  };

  const handleStartFocus = () => {
    if (!task || task.id === "new") return;
    navigation.focusOnTask(task.id);
  };

  const handlePlanToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setLocalAssignedDate(today.getTime());
  };

  const handleShare = () => {
    if (!task) return;
    const tagInfo = getTagInfo(localCategory);
    const text = `Task: ${title}\nProject: ${tagInfo?.name || "None"}\nEnergy: ${localEnergy || "None"}\nNotes: ${notes}`;
    navigator.clipboard.writeText(text).then(() => {
      useTaskAppStore.getState().showToast("Copied to clipboard");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    const onError = (err: Error) => {
      useTaskAppStore.getState().showToast("Failed to sync changes. Please check your connection.");
      console.error("Optimistic write failed:", err);
    };

    try {
      let finalCategoryId = localCategory;
      const isNewTag = localCategory && !tags.some((t) => t.id === localCategory);
      const now = Date.now();

      if (task.id === "new") {
        const energyValue =
          localEnergy === "High" ? 80 : localEnergy === "Low" ? 30 : 50;

        let newTaskId: string;

        if (isNewTag && localCategory) {
          const capitalizedName = localCategory.charAt(0).toUpperCase() + localCategory.slice(1);
          const result = await taskApi.addTaskWithNewTag(
            parsed.cleanTitle,
            capitalizedName,
            localDuration ?? 0,
            energyValue,
            notes,
            localDueDate ?? null,
            localAssignedDate ?? null,
            localRecurrence ?? null,
            onError
          );
          newTaskId = result.taskId;
          finalCategoryId = result.tagId;

          useTaskAppStore.getState().setOptimisticTag(finalCategoryId, {
            id: finalCategoryId,
            name: capitalizedName,
            parentId: null,
            color: '#64748b',
            order: now
          });
        } else {
          newTaskId = await taskApi.addTask(
            parsed.cleanTitle,
            finalCategoryId || "",
            localDuration ?? 0,
            energyValue,
            notes,
            localDueDate ?? null,
            localAssignedDate ?? null,
            localRecurrence ?? null,
            onError
          );
        }

        const newTask = {
            id: newTaskId,
            title: parsed.cleanTitle,
            category: finalCategoryId || "",
            duration: localDuration ?? 0,
            energy: localEnergy || 'Medium',
            notes,
            dueDate: localDueDate ?? null,
            assignedDate: localAssignedDate ?? null,
            recurrence: localRecurrence ?? null,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            blockedBy: [],
        } as Task;

        // Optimistic UI update in store
        const store = useTaskAppStore.getState();
        store.setOptimisticTask(newTaskId, newTask);
        store.setActiveView('tasks');
        store.setTaskTab('active');
        store.setSearchQuery("");
        store.setSelectedTask(newTask);
        onClose?.();
        useTaskAppStore.getState().showToast(isOffline ? "Task saved locally" : "Task created");
      } else {
        // Handle tag creation for existing task updates
        if (isNewTag && localCategory) {
          const capitalizedName = localCategory.charAt(0).toUpperCase() + localCategory.slice(1);
          finalCategoryId = await tagApi.createTag(capitalizedName, null, onError);

          useTaskAppStore.getState().setOptimisticTag(finalCategoryId, {
            id: finalCategoryId,
            name: capitalizedName,
            parentId: null,
            color: '#64748b',
            order: now
          });
        }

        const updates = {
          title: parsed.cleanTitle,
          notes: notes,
          energy: localEnergy,
          duration: localDuration,
          dueDate: localDueDate ?? null,
          assignedDate: localAssignedDate ?? null,
          recurrence: (localDueDate ? localRecurrence : undefined) ?? null,
          category: finalCategoryId,
          updatedAt: now
        };

        useTaskAppStore.getState().setOptimisticTask(task.id, updates);
        taskApi.updateTask(task.id, updates, onError);

        useTaskAppStore.getState().showToast(isOffline ? "Changes saved locally" : "Changes saved");
      }
    } catch (e) {
      console.error("Failed to save task", e);
      useTaskAppStore.getState().showToast("Failed to save. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-2">
        <div className="flex items-center gap-2">
          {task && task.id !== "new" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleComplete}
                  >
                    {task.status === "completed" ? (
                      <Undo2 className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    <span className="sr-only">
                      {task.status === "completed" ? "Mark Active" : "Mark Done"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {task.status === "completed" ? "Mark Active" : "Mark Done"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isReadOnly || (!!navigation.activeTaskId && navigation.activeTaskId !== task.id)}
                    onClick={handleStartFocus}
                  >
                    <Zap className={cn("h-4 w-4", !!navigation.activeTaskId && navigation.activeTaskId !== task.id && "text-muted-foreground/50")} />
                    <span className="sr-only">Focus</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {navigation.activeTaskId && navigation.activeTaskId !== task?.id ? "Another task is in focus" : "Focus"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isReadOnly}
                    onClick={handlePlanToday}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="sr-only">Plan today</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Plan today</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {task && task.id !== "new" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleArchive}
                  >
                    {task?.status === "archived" ? (
                      <ArchiveX className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {task?.status === "archived"
                        ? "Remove from Archive"
                        : "Archive"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {task?.status === "archived" ? "Remove from Archive" : "Archive"}
                </TooltipContent>
              </Tooltip>
              {task?.status === "archived" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      ref={deleteButtonRef}
                      variant="ghost"
                      size="icon"
                      className={showDeleteConfirm ? "text-red-500 hover:text-red-600 hover:bg-red-50" : ""}
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Task</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showDeleteConfirm ? "Confirm Delete" : "Delete Task"}
                  </TooltipContent>
                </Tooltip>
              )}
              <Separator orientation="vertical" className="mx-1 h-6" />
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleSave}
                disabled={isSaving || isReadOnly}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : task?.id === "new" ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {isSaving
                    ? (typeof navigator !== 'undefined' && !navigator.onLine
                      ? "Saving locally..."
                      : (task?.id === "new" ? "Creating..." : "Saving..."))
                    : task?.id === "new" ? "Create Task" : "Save"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {task?.id === "new" ? "Create Task" : "Save"} ({isMac ? "⌘" : "Ctrl+"}Enter)
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      {task ? (
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-4 p-4">
            <AutoResizeTextarea
              className="resize-none border-none p-0 text-2xl font-bold focus-visible:ring-0 bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Task Title..."
              minRows={1}
              maxRows={4}
              readOnly={isReadOnly}
            />

            <AutoResizeTextarea
              className="p-4 bg-muted/20 rounded-lg"
              placeholder={`Task notes and details...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value.substring(0, 5000))}
              onKeyDown={handleKeyDown}
              minRows={3}
              maxRows={8}
              readOnly={isReadOnly}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  {(() => {
                    const info = getTagInfo(localCategory);
                    return info ? (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        style={
                          info.color
                            ? {
                                backgroundColor: `${info.color}33`,
                                color: info.color,
                                borderColor: `${info.color}66`,
                              }
                            : {}
                        }
                      >
                        <Tag className="h-3 w-3" aria-hidden="true" />
                        {info.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" aria-hidden="true" />
                        Add Project
                      </Badge>
                    );
                  })()}
                </PopoverTrigger>
                <PopoverContent className="w-fit p-3" align="start">
                  <TagPicker
                    tags={tags}
                    selectedTagId={localCategory}
                    onSelect={(id) => {
                      setLocalCategory(id);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  {localEnergy ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1 cursor-pointer transition-colors",
                        localEnergy === 'High' ? "border-orange-500/30 text-orange-500 hover:bg-orange-500/10" :
                        localEnergy === 'Low' ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" :
                        "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      )}
                    >
                      <Zap className="h-3 w-3" aria-hidden="true" />
                      {localEnergy}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    >
                      <Zap className="h-3 w-3" />
                      Add Energy
                    </Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-fit p-3" align="start">
                  <EnergyPicker
                    energy={localEnergy || "Medium"}
                    onChange={(val) => {
                      setLocalEnergy(val);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  {localDuration && localDuration > 0 ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors"
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {localDuration}m
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Add Duration
                    </Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-fit p-3" align="start">
                  <DurationPicker
                    duration={localDuration || 0}
                    onChange={(val) => {
                      setLocalDuration(val);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  {localAssignedDate ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-blue-500/30 text-blue-400 cursor-pointer hover:bg-blue-400/10 transition-colors"
                    >
                      <CalendarClock className="h-3 w-3" aria-hidden="true" />
                      {new Date(localAssignedDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    >
                      <Clock className="h-3 w-3" />
                      Set Schedule
                    </Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0" align="start">
                  <DatePicker
                    value={localAssignedDate}
                    type="assigned"
                    onChange={(val) => {
                      setLocalAssignedDate(val);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  {localDueDate ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-red-500/30 text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
                    >
                      <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                      {new Date(localDueDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    >
                      <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                      Set Deadline
                    </Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0" align="start">
                  <DatePicker
                    value={localDueDate}
                    type="due"
                    onChange={(val) => {
                      setLocalDueDate(val);
                    }}
                  />
                </PopoverContent>
              </Popover>

              {localDueDate && (
                <Popover>
                  <PopoverTrigger asChild disabled={isReadOnly}>
                    {localRecurrence ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-400/10 transition-colors"
                      >
                        <Repeat className="h-3 w-3" aria-hidden="true" />
                        {formatRecurrence(localRecurrence)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                      >
                        <Repeat className="h-3 w-3" aria-hidden="true" />
                        Add Repeat
                      </Badge>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-3" align="start">
                    <RecurrenceInlinePicker
                      standalone
                      value={localRecurrence}
                      baseDate={new Date(localDueDate)}
                      onChange={(val) => {
                        setLocalRecurrence(val);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {task.blockedBy?.length > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-orange-500/30 text-orange-500"
                >
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  {task.blockedBy.length}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <MousePointerClick className="size-8 opacity-50" />
          No task selected
        </div>
      )}
    </div>
  );
}

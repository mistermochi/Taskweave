import { useState, useEffect, useMemo, useRef } from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import {
  Archive,
  ArchiveX,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Layers,
  Loader2,
  MoreVertical,
  MousePointerClick,
  Repeat,
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
    try {
      if (task.status === "completed") {
        await taskApi.uncompleteTask(task.id);
        useTaskAppStore.getState().showToast("Task reactivated");
      } else {
        // Use 0 as default actual duration if not specified
        await taskApi.completeTask(task, 0, allTasks);

        // Navigate away from the task
        useTaskAppStore.getState().setSelectedTask(null);

        onClose?.();
        useTaskAppStore.getState().showToast("Task completed", () => {
          taskApi.uncompleteTask(task.id);
        });
      }
    } catch (e) {
      console.error("Failed to toggle task completion", e);
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
    try {
      if (task.status === "archived") {
        await taskApi.unarchiveTask(task.id);
        useTaskAppStore.getState().showToast("Task restored");
      } else {
        await taskApi.archiveTask(task.id);

        // Navigate away from the task
        useTaskAppStore.getState().setSelectedTask(null);

        onClose?.();
        useTaskAppStore.getState().showToast("Task archived", () => {
          taskApi.unarchiveTask(task.id);
        });
      }
    } catch (e) {
      console.error("Failed to toggle archive", e);
    }
  };

  const handleDelete = async () => {
    if (!task || task.id === "new") return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      useTaskAppStore.getState().showToast("Click again to permanently delete this task");
      return;
    }

    try {
      await taskApi.deleteTask(task.id);
      useTaskAppStore.getState().setSelectedTask(null);
      onClose?.();
      useTaskAppStore.getState().showToast("Task permanently deleted");
    } catch (e) {
      console.error("Failed to delete task", e);
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
    try {
      let finalCategoryId = localCategory;

      // Handle new tag creation if localCategory is a name and not an existing tag ID
      if (localCategory && !tags.some((t) => t.id === localCategory)) {
        // Capitalize tag name
        const capitalizedName =
          localCategory.charAt(0).toUpperCase() + localCategory.slice(1);
        finalCategoryId = await tagApi.createTag(capitalizedName);
      }

      if (task.id === "new") {
        const energyValue =
          localEnergy === "High" ? 80 : localEnergy === "Low" ? 30 : 50;
        const newTaskId = await taskApi.addTask(
          parsed.cleanTitle,
          finalCategoryId || "",
          localDuration ?? 0,
          energyValue,
          notes,
          localDueDate ?? null,
          localAssignedDate ?? null,
          localRecurrence ?? null,
        );

        // Navigate to the new task (it will keep the search query because we're just updating the selectedTask in the store)
        // Actually, we need the new task object to select it.
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
            createdAt: Date.now(),
            blockedBy: [],
        } as Task;
        useTaskAppStore.getState().setSelectedTask(newTask);

        onClose?.();
        useTaskAppStore.getState().showToast("Task created");
      } else {
        await taskApi.updateTask(task.id, {
          title: parsed.cleanTitle,
          notes: notes,
          energy: localEnergy,
          duration: localDuration,
          dueDate: localDueDate ?? null,
          assignedDate: localAssignedDate ?? null,
          recurrence: (localDueDate ? localRecurrence : undefined) ?? null,
          category: finalCategoryId,
        });
        useTaskAppStore.getState().showToast("Changes saved");
      }
    } catch (e) {
      console.error("Failed to save task", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-2">
        <div className="flex items-center gap-2">
          {task && task.id !== "new" && (
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
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new" || (!!navigation.activeTaskId && navigation.activeTaskId !== task.id)}
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
                disabled={!task || task.id === "new"}
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
                disabled={!task || task.id === "new"}
                onClick={handleShare}
              >
                <Share className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new"}
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
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!task || task.id === "new"}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {task ? (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            <AutoResizeTextarea
              className="resize-none border-none p-0 text-2xl font-bold focus-visible:ring-0 bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task Title..."
              minRows={1}
              maxRows={4}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
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
                        <Tag className="h-3 w-3" />
                        {info.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" />
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
                <PopoverTrigger asChild>
                  {localEnergy ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-blue-500/30 text-blue-500 cursor-pointer hover:bg-blue-500/10 transition-colors"
                    >
                      <Zap className="h-3 w-3" />
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
                <PopoverTrigger asChild>
                  {localDuration && localDuration > 0 ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors"
                    >
                      <Clock className="h-3 w-3" />
                      {localDuration}m
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    >
                      <Clock className="h-3 w-3" />
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
                <PopoverTrigger asChild>
                  {localAssignedDate ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-blue-500/30 text-blue-400 cursor-pointer hover:bg-blue-400/10 transition-colors"
                    >
                      <Clock className="h-3 w-3" />
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
                <PopoverTrigger asChild>
                  {localDueDate ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-red-500/30 text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
                    >
                      <CalendarIcon className="h-3 w-3" />
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
                      <CalendarIcon className="h-3 w-3" />
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
                  <PopoverTrigger asChild>
                    {localRecurrence ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-400/10 transition-colors"
                      >
                        <Repeat className="h-3 w-3" />
                        {formatRecurrence(localRecurrence)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                      >
                        <Repeat className="h-3 w-3" />
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
                  <Layers className="h-3 w-3" />
                  {task.blockedBy.length}
                </Badge>
              )}
            </div>
          </div>
          <Separator className="mt-auto" />
          <div className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="grid gap-4">
                <AutoResizeTextarea
                  className="p-4 bg-muted/20"
                  placeholder={`Task notes and details...`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={handleKeyDown}
                  minRows={3}
                  maxRows={8}
                />
                <div className="flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="sm"
                        className="ml-auto"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {task.id === "new" ? "Creating..." : "Saving..."}
                          </>
                        ) : task.id === "new" ? (
                          "Create Task"
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {task.id === "new" ? "Create Task" : "Save"} ({isMac ? "⌘" : "Ctrl+"}Enter)
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </form>
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

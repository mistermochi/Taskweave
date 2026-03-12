import { useState, useEffect, useMemo } from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import {
  Archive,
  ArchiveX,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Forward,
  Layers,
  MoreVertical,
  MousePointerClick,
  Repeat,
  Reply,
  ReplyAll,
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
import { Tag as TagEntity } from "@/entities/tag";
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
  const today = new Date();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [lastParsedAttributes, setLastParsedAttributes] = useState<
    ParsedTaskInput["attributes"]
  >({});

  const navigation = useNavigation();

  // BOLT: Use a memoized map for O(1) tag lookups instead of repeated O(N) array scans in render.
  const tagsMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {} as Record<string, TagEntity>);
  }, [tags]);

  const getTagInfo = (categoryId: string | undefined) => {
    if (!categoryId) return null;
    const tag = tagsMap[categoryId];
    if (tag) return { name: tag.name, color: tag.color };
    return { name: categoryId, color: undefined };
  };

  useEffect(() => {
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
    setActiveEditor(null);
    setLastParsedAttributes({});
  }, [task]);

  const parsed = useMemo(() => {
    return parseTaskInput(title);
  }, [title]);

  useEffect(() => {
    const { attributes } = parsed;

    if (attributes.tagKeyword !== lastParsedAttributes.tagKeyword) {
      setLocalCategory(attributes.tagKeyword);
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
  }, [parsed, lastParsedAttributes]);

  const handleToggleComplete = async () => {
    if (!task || task.id === "new") return;
    try {
      if (task.status === "completed") {
        await taskApi.uncompleteTask(task.id);
        useTaskAppStore.getState().showToast("Task reactivated");
      } else {
        // Use 0 as default actual duration if not specified
        await taskApi.completeTask(task, 0, allTasks);
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

  const handleToggleArchive = async () => {
    if (!task || task.id === "new") return;
    try {
      if (task.status === "archived") {
        await taskApi.unarchiveTask(task.id);
        useTaskAppStore.getState().showToast("Task restored");
      } else {
        await taskApi.archiveTask(task.id);
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
      if (task.id === "new") {
        const energyValue =
          localEnergy === "High" ? 80 : localEnergy === "Low" ? 30 : 50;
        await taskApi.addTask(
          parsed.cleanTitle,
          localCategory || "",
          localDuration ?? 0,
          energyValue,
          notes,
          localDueDate ?? null,
          localAssignedDate ?? null,
          localRecurrence ?? null,
        );
        useTaskAppStore.getState().setSelectedTask(null);
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
          category: localCategory,
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new"}
                onClick={handleStartFocus}
              >
                <Zap className="h-4 w-4" />
                <span className="sr-only">Focus</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Focus</TooltipContent>
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

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!task || task.id === "new"}
                >
                  <Clock className="h-4 w-4" />
                  <span className="sr-only">Snooze</span>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent className="flex w-[535px] p-0">
              <div className="flex flex-col gap-2 border-r px-2 py-4">
                <div className="px-4 text-sm font-medium">Snooze until</div>
                <div className="grid min-w-[250px] gap-1">
                  <Button variant="ghost" className="justify-start font-normal">
                    Later today{" "}
                    <span className="text-muted-foreground ml-auto">
                      {format(addHours(today, 4), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Tomorrow
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 1), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    This weekend
                    <span className="text-muted-foreground ml-auto">
                      {format(nextSaturday(today), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Next week
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 7), "E, h:m b")}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Calendar />
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Snooze</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new"}
              >
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new"}
              >
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!task || task.id === "new"}
              >
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
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
                    onClick={() =>
                      setActiveEditor(
                        activeEditor === "category" ? null : "category",
                      )
                    }
                  >
                    <Tag className="h-3 w-3" />
                    {info.name}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    onClick={() =>
                      setActiveEditor(
                        activeEditor === "category" ? null : "category",
                      )
                    }
                  >
                    <Tag className="h-3 w-3" />
                    Add Project
                  </Badge>
                );
              })()}

              {localEnergy ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-blue-500/30 text-blue-500 cursor-pointer hover:bg-blue-500/10 transition-colors"
                  onClick={() =>
                    setActiveEditor(activeEditor === "energy" ? null : "energy")
                  }
                >
                  <Zap className="h-3 w-3" />
                  {localEnergy}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                  onClick={() =>
                    setActiveEditor(activeEditor === "energy" ? null : "energy")
                  }
                >
                  <Zap className="h-3 w-3" />
                  Add Energy
                </Badge>
              )}

              {localDuration && localDuration > 0 ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "duration" ? null : "duration",
                    )
                  }
                >
                  <Clock className="h-3 w-3" />
                  {localDuration}m
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "duration" ? null : "duration",
                    )
                  }
                >
                  <Clock className="h-3 w-3" />
                  Add Duration
                </Badge>
              )}

              {localAssignedDate ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-blue-500/30 text-blue-400 cursor-pointer hover:bg-blue-400/10 transition-colors"
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "assignedDate" ? null : "assignedDate",
                    )
                  }
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
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "assignedDate" ? null : "assignedDate",
                    )
                  }
                >
                  <Clock className="h-3 w-3" />
                  Set Schedule
                </Badge>
              )}

              {localDueDate ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-red-500/30 text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "dueDate" ? null : "dueDate",
                    )
                  }
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
                  onClick={() =>
                    setActiveEditor(
                      activeEditor === "dueDate" ? null : "dueDate",
                    )
                  }
                >
                  <CalendarIcon className="h-3 w-3" />
                  Set Deadline
                </Badge>
              )}

              {localDueDate &&
                (localRecurrence ? (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-400/10 transition-colors"
                    onClick={() =>
                      setActiveEditor(
                        activeEditor === "recurrence" ? null : "recurrence",
                      )
                    }
                  >
                    <Repeat className="h-3 w-3" />
                    {formatRecurrence(localRecurrence)}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors border-dashed text-muted-foreground"
                    onClick={() =>
                      setActiveEditor(
                        activeEditor === "recurrence" ? null : "recurrence",
                      )
                    }
                  >
                    <Repeat className="h-3 w-3" />
                    Add Repeat
                  </Badge>
                ))}

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

            {activeEditor && (
              <div className="rounded-lg border bg-card p-3 shadow-sm relative animate-in fade-in slide-in-from-top-1 duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => setActiveEditor(null)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {activeEditor === "category" && (
                  <TagPicker
                    tags={tags}
                    selectedTagId={localCategory}
                    onSelect={(id) => {
                      setLocalCategory(id);
                      setActiveEditor(null);
                    }}
                  />
                )}
                {activeEditor === "energy" && (
                  <EnergyPicker
                    energy={localEnergy || "Medium"}
                    onChange={(val) => {
                      setLocalEnergy(val);
                      setActiveEditor(null);
                    }}
                  />
                )}
                {activeEditor === "duration" && (
                  <DurationPicker
                    duration={localDuration || 0}
                    onChange={(val) => {
                      setLocalDuration(val);
                    }}
                  />
                )}
                {activeEditor === "assignedDate" && (
                  <DatePicker
                    value={localAssignedDate}
                    type="assigned"
                    onChange={(val) => {
                      setLocalAssignedDate(val);
                      if (val) setActiveEditor(null);
                    }}
                  />
                )}
                {activeEditor === "dueDate" && (
                  <DatePicker
                    value={localDueDate}
                    type="due"
                    onChange={(val) => {
                      setLocalDueDate(val);
                      if (val) setActiveEditor(null);
                    }}
                  />
                )}
                {activeEditor === "recurrence" && localDueDate && (
                  <RecurrenceInlinePicker
                    standalone
                    value={localRecurrence}
                    baseDate={new Date(localDueDate)}
                    onChange={(val) => {
                      setLocalRecurrence(val);
                      setActiveEditor(null);
                    }}
                  />
                )}
              </div>
            )}
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
                  <Button
                    type="submit"
                    size="sm"
                    className="ml-auto"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : task.id === "new"
                        ? "Create Task"
                        : "Save"}
                  </Button>
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

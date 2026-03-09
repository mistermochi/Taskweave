import React, { useEffect, useState, useMemo } from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import {
  Archive,
  ArchiveX,
  Calendar as CalendarIcon,
  Clock,
  Forward,
  Layers,
  MoreVertical,
  Repeat,
  Reply,
  ReplyAll,
  Tag,
  Trash2,
  Zap
} from "lucide-react";
import { useTaskAppStore } from "../use-task-app";

import { DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/ui/dropdown-menu";
import { Badge } from "@/shared/ui/ui/badge";
import { Button } from "@/shared/ui/ui/button";
import { Calendar } from "@/shared/ui/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger } from "@/shared/ui/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/ui/popover";
import { Separator } from "@/shared/ui/ui/separator";
import { Textarea } from "@/shared/ui/ui/textarea";
import { AutoResizeTextarea } from "@/shared/ui/ui/auto-resize-textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { Task, taskApi } from "@/entities/task";
import { Tag as TagEntity } from "@/entities/tag";
import { Drawer, DrawerContent } from "@/shared/ui/ui/drawer";
import { DialogHeader, DialogTitle } from "@/shared/ui/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { parseTaskInput } from "@/shared/lib/textParserUtils";
import { formatRecurrence } from "@/shared/lib/timeUtils";

interface TaskDisplayProps {
  task: Task | null;
  tags: TagEntity[];
}

export function TaskDisplayMobile({ task, tags }: TaskDisplayProps) {
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  const { selectedTask, setSelectedTask } = useTaskAppStore();

  const getTagInfo = (categoryId: string | undefined) => {
    if (!categoryId) return null;
    const tag = tags.find(t => t.id === categoryId);
    if (tag) return { name: tag.name, color: tag.color };
    return { name: categoryId, color: undefined };
  };

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setOpen(true);
      setTitle(selectedTask.title);
      setNotes(selectedTask.notes || "");
    }
  }, [selectedTask]);

  useEffect(() => {
    if (!open) {
      setSelectedTask(null);
    }
  }, [open, setSelectedTask]);

  const parsed = useMemo(() => {
    return parseTaskInput(title);
  }, [title]);

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
        if (task.id === "new") {
            const energyValue = (parsed.attributes.energy || task.energy) === "High" ? 80 : (parsed.attributes.energy || task.energy) === "Low" ? 30 : 50;
            await taskApi.addTask(
                parsed.cleanTitle,
                (parsed.attributes.tagKeyword || task.category || ""),
                parsed.attributes.duration ?? task.duration ?? 0,
                energyValue,
                notes,
                parsed.attributes.dueDate ?? task.dueDate,
                parsed.attributes.assignedDate ?? task.assignedDate,
                parsed.attributes.recurrence ?? task.recurrence
            );
            useTaskAppStore.getState().setSelectedTask(null);
        } else {
            await taskApi.updateTask(task.id, {
                title: parsed.cleanTitle,
                notes: notes,
                energy: parsed.attributes.energy || task.energy,
                duration: parsed.attributes.duration ?? task.duration,
                dueDate: parsed.attributes.dueDate ?? task.dueDate,
                assignedDate: parsed.attributes.assignedDate ?? task.assignedDate,
                recurrence: parsed.attributes.recurrence ?? task.recurrence,
                category: parsed.attributes.tagKeyword || task.category
            });
        }
    } catch (e) {
        console.error("Failed to save task", e);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Task Display</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Archive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <ArchiveX className="h-4 w-4" />
                    <span className="sr-only">Move to junk</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to junk</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Move to trash</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to trash</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!task}>
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
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <Reply className="h-4 w-4" />
                    <span className="sr-only">Reply</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <ReplyAll className="h-4 w-4" />
                    <span className="sr-only">Reply all</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply all</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!task}>
                    <Forward className="h-4 w-4" />
                    <span className="sr-only">Forward</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!task}>
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

          {task && (
            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <AutoResizeTextarea
                  className="resize-none border-none p-0 text-2xl font-bold focus-visible:ring-0 bg-transparent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Title..."
                  minRows={1}
                  maxRows={4}
                />

                <div className="flex flex-wrap items-center gap-2">
                    {(parsed.attributes.tagKeyword || task.category) && (() => {
                        const info = getTagInfo(parsed.attributes.tagKeyword || task.category);
                        return info ? (
                            <Badge
                                variant="secondary"
                                className="flex items-center gap-1"
                                style={info.color ? { backgroundColor: `${info.color}33`, color: info.color, borderColor: `${info.color}66` } : {}}
                            >
                                <Tag className="h-3 w-3" />
                                {info.name}
                            </Badge>
                        ) : null;
                    })()}
                    {(parsed.attributes.energy || task.energy) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-blue-500/30 text-blue-500">
                            <Zap className="h-3 w-3" />
                            {parsed.attributes.energy || task.energy}
                        </Badge>
                    )}
                    {((parsed.attributes.duration ?? task.duration) > 0) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {parsed.attributes.duration ?? task.duration}m
                        </Badge>
                    )}
                    {(parsed.attributes.assignedDate ?? task.assignedDate) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-blue-500/30 text-blue-400">
                            <Clock className="h-3 w-3" />
                            {new Date(parsed.attributes.assignedDate ?? task.assignedDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Badge>
                    )}
                    {(parsed.attributes.dueDate ?? task.dueDate) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-red-500/30 text-red-500">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(parsed.attributes.dueDate ?? task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Badge>
                    )}
                    {(parsed.attributes.recurrence ?? task.recurrence) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-purple-500/30 text-purple-400">
                            <Repeat className="h-3 w-3" />
                            {formatRecurrence(parsed.attributes.recurrence ?? task.recurrence)}
                        </Badge>
                    )}
                    {task.blockedBy?.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 border-orange-500/30 text-orange-500">
                            <Layers className="h-3 w-3" />
                            {task.blockedBy.length}
                        </Badge>
                    )}
                </div>
              </div>

              <Separator className="mt-auto" />

              <div className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  <div className="grid gap-4">
                    <AutoResizeTextarea
                      className="p-4 bg-muted/20"
                      placeholder={`Task notes and details...`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minRows={3}
                      maxRows={8}
                    />
                    <div className="flex items-center">
                      <Button type="submit" size="sm" className="ml-auto" disabled={isSaving}>
                        {isSaving ? "Saving..." : (task.id === "new" ? "Create Task" : "Save")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

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
import { useMailStore } from "../use-mail";

import { DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/ui/dropdown-menu";
import { Badge } from "@/shared/ui/ui/badge";
import { Button } from "@/shared/ui/ui/button";
import { Calendar } from "@/shared/ui/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger } from "@/shared/ui/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/ui/popover";
import { Separator } from "@/shared/ui/ui/separator";
import { Textarea } from "@/shared/ui/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { Task, taskApi } from "@/entities/task";
import { Drawer, DrawerContent } from "@/shared/ui/ui/drawer";
import { DialogHeader, DialogTitle } from "@/shared/ui/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { parseTaskInput } from "@/shared/lib/textParserUtils";

interface MailDisplayProps {
  mail: Task | null;
}

export function MailDisplayMobile({ mail }: MailDisplayProps) {
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  const { selectedMail, setSelectedMail } = useMailStore();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedMail) {
      setOpen(true);
      setTitle(selectedMail.title);
      setNotes(selectedMail.notes || "");
    }
  }, [selectedMail]);

  useEffect(() => {
    if (!open) {
      setSelectedMail(null);
    }
  }, [open, setSelectedMail]);

  const parsed = useMemo(() => {
    return parseTaskInput(title);
  }, [title]);

  const handleSave = async () => {
    if (!mail) return;
    setIsSaving(true);
    try {
        await taskApi.updateTask(mail.id, {
            title: parsed.cleanTitle,
            notes: notes,
            energy: parsed.attributes.energy || mail.energy,
            duration: parsed.attributes.duration ?? mail.duration,
            dueDate: parsed.attributes.dueDate ?? mail.dueDate,
            assignedDate: parsed.attributes.assignedDate ?? mail.assignedDate,
            recurrence: parsed.attributes.recurrence ?? mail.recurrence,
            category: parsed.attributes.tagKeyword || mail.category
        });
        setTitle(parsed.cleanTitle);
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
            <DialogTitle>Mail Display</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Archive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <ArchiveX className="h-4 w-4" />
                    <span className="sr-only">Move to junk</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to junk</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
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
                      <Button variant="ghost" size="icon" disabled={!mail}>
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
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Reply className="h-4 w-4" />
                    <span className="sr-only">Reply</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <ReplyAll className="h-4 w-4" />
                    <span className="sr-only">Reply all</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply all</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
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
                <Button variant="ghost" size="icon" disabled={!mail}>
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

          {mail && (
            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <Textarea
                  className="resize-none border-none p-0 text-2xl font-bold focus-visible:ring-0 bg-transparent min-h-[40px]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Title..."
                  rows={1}
                />

                <div className="flex flex-wrap items-center gap-2">
                    {(parsed.attributes.tagKeyword || mail.category) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {parsed.attributes.tagKeyword || mail.category}
                        </Badge>
                    )}
                    {(parsed.attributes.energy || mail.energy) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-blue-500/30 text-blue-500">
                            <Zap className="h-3 w-3" />
                            {parsed.attributes.energy || mail.energy}
                        </Badge>
                    )}
                    {((parsed.attributes.duration ?? mail.duration) > 0) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {parsed.attributes.duration ?? mail.duration}m
                        </Badge>
                    )}
                    {(parsed.attributes.dueDate ?? mail.dueDate) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-red-500/30 text-red-500">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(parsed.attributes.dueDate ?? mail.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Badge>
                    )}
                    {(parsed.attributes.assignedDate ?? mail.assignedDate) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-blue-500/30 text-blue-400">
                            <Clock className="h-3 w-3" />
                            {new Date(parsed.attributes.assignedDate ?? mail.assignedDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Badge>
                    )}
                    {(parsed.attributes.recurrence ?? mail.recurrence) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {(parsed.attributes.recurrence ?? mail.recurrence)!.frequency}
                        </Badge>
                    )}
                    {mail.blockedBy?.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 border-orange-500/30 text-orange-500">
                            <Layers className="h-3 w-3" />
                            {mail.blockedBy.length}
                        </Badge>
                    )}
                </div>
              </div>

              <Separator className="mt-auto" />

              <div className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  <div className="grid gap-4">
                    <Textarea
                      className="min-h-[300px] p-4 bg-muted/20"
                      placeholder={`Task notes and details...`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex items-center">
                      <Button type="submit" size="sm" className="ml-auto" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
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

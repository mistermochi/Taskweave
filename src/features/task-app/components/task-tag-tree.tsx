"use client";

import * as React from "react";
import { ChevronRight, ChevronDown, Edit2, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Tag, tagApi } from "@/entities/tag";
import { Task } from "@/entities/task";
import { useTaskAppStore } from "../use-task-app";
import { useNavigation } from "@/context/NavigationContext";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/shared/ui/ui/context-menu";
import { Button } from "@/shared/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/ui/dialog";
import { Input } from "@/shared/ui/ui/input";
import { Label } from "@/shared/ui/ui/label";

interface TaskTagTreeProps {
  tags: Tag[];
  tasks: Task[];
  isCollapsed: boolean;
}

export function TaskTagTree({ tags, tasks, isCollapsed }: TaskTagTreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const { selectedTagId, setSelectedTagId, setShowSettings } = useTaskAppStore();
  const { selectTag } = useNavigation();
  const [draggedTagId, setDraggedTagId] = React.useState<string | null>(null);

  // CRUD state
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
  const [newName, setNewName] = React.useState("");
  const [deletingTag, setDeletingTag] = React.useState<Tag | null>(null);

  // Pre-calculate task counts per tag
  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(task => {
        if (task.status === 'active' && task.category) {
            counts[task.category] = (counts[task.category] || 0) + 1;
        }
    });
    return counts;
  }, [tasks]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTagId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");

    if (sourceId && sourceId !== targetId) {
      await tagApi.moveTag(sourceId, targetId);
    }
    setDraggedTagId(null);
  };

  const handleRename = async () => {
    if (editingTag && newName.trim()) {
        await tagApi.updateTag(editingTag.id, { name: newName.trim() });
        setEditingTag(null);
    }
  };

  const handleDelete = async () => {
    if (deletingTag) {
        await tagApi.deleteTag(deletingTag.id);
        setDeletingTag(null);
    }
  };

  const buildTree = (parentId: string | null) => {
    return tags
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((tag) => {
        const hasChildren = tags.some((t) => t.parentId === tag.id);
        const isExpanded = expanded.has(tag.id);
        const isActive = selectedTagId === tag.id;
        const count = tagCounts[tag.id] || tagCounts[tag.name] || 0;

        return (
          <div key={tag.id} className="flex flex-col">
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all relative select-none",
                    isActive
                      ? "bg-accent text-accent-foreground dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    draggedTagId === tag.id && "opacity-50"
                  )}
                  onClick={() => {
                    const nextId = isActive ? null : tag.id;
                    setSelectedTagId(nextId);
                    selectTag(nextId);
                    setShowSettings(false);
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tag.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, tag.id);
                  }}
                >
                  <button
                    onClick={(e) => toggleExpand(tag.id, e)}
                    className={cn(
                      "p-0.5 rounded-sm hover:bg-accent transition-colors",
                      !hasChildren && "opacity-0 pointer-events-none"
                    )}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="size-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className={cn("text-sm truncate", isActive && "font-medium")}>
                      {tag.name}
                    </span>
                  </div>

                  {count > 0 && (
                      <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/70 group-hover:text-muted-foreground">
                        {count}
                      </span>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                    setEditingTag(tag);
                    setNewName(tag.name);
                }}>
                  <Edit2 className="mr-2 size-4" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                    setDeletingTag(tag);
                }}>
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => tagApi.createTag("New Sub-project", tag.id)}>
                    <Plus className="mr-2 size-4" />
                    Add Sub-project
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {hasChildren && isExpanded && (
              <div className="ml-4 border-l border-muted/50 flex flex-col pl-1 my-0.5">
                {buildTree(tag.id)}
              </div>
            )}
          </div>
        );
      });
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-2 gap-4">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setSelectedTagId(null);
                selectTag(null);
                setShowSettings(false);
              }}
            >
              <TagIcon className="size-4" />
              <span className="sr-only">Projects</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Projects</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-0 py-2">
        <div className="flex items-center justify-between px-4 mb-1 group">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => tagApi.createTag("New Project", null)}
          >
            <Plus size={14} />
            <span className="sr-only">Add Project</span>
          </Button>
        </div>
        <div
          className="flex flex-col min-h-[20px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          {buildTree(null)}
        </div>
      </div>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>Cancel</Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTag?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTag(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

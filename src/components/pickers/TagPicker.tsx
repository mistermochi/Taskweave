import React, { useState, useEffect, useMemo } from 'react';
import { Tag } from '@/entities/tag';
import { processTagsForPicker } from '@/entities/tag/lib/tag-utils';
import { Check, ChevronRight, ChevronDown, Hash, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/ui/input';
import { Separator } from '@/shared/ui/ui/separator';

/**
 * Interface for TagPicker props.
 */
interface TagPickerProps {
  /** Full list of tags to display in the tree. */
  tags: Tag[];
  /** The currently selected tag ID (empty string for Inbox). */
  selectedTagId: string | undefined;
  /** Callback triggered when a tag is selected. */
  onSelect: (tagId: string) => void;
}

/**
 * A hierarchical tree-based picker for selecting a task's project (Tag).
 * It supports nested levels and includes an "Inbox" (no-tag) option.
 * Includes search functionality for quickly finding projects.
 *
 * @component
 */
export const TagPicker: React.FC<TagPickerProps> = ({ tags, selectedTagId, onSelect }) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Performance Optimization (Bolt ⚡):
   * Consolidate tag lookups, hierarchy grouping, and search visibility into a single O(T) pass.
   * This replaces O(T^2) recursive filtering with O(1) map lookups.
   */
  const { tagsById, tagsByParent, visibleTags } = useMemo(() => {
    return processTagsForPicker(tags, searchQuery);
  }, [tags, searchQuery]);

  /**
   * Auto-expand to show selected tag in the hierarchy.
   */
  useEffect(() => {
    if (selectedTagId) {
        const parentIds = new Set<string>();
        let current = tagsById.get(selectedTagId);
        while (current && current.parentId) {
            parentIds.add(current.parentId);
            current = tagsById.get(current.parentId);
        }
        if (parentIds.size > 0) {
          setExpandedTags(prev => new Set([...Array.from(prev), ...Array.from(parentIds)]));
        }
    }
  }, [selectedTagId, tagsById]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(expandedTags);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTags(newSet);
  };

  /**
   * Recursive function to render the tag tree branches.
   * Optimized to use pre-calculated maps and visibility sets.
   */
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const children = tagsByParent.get(parentId) || [];
    if (children.length === 0) return null;

    return children.map(tag => {
        // If searching, only render if this tag or any of its descendants are visible
        if (searchQuery && !visibleTags.has(tag.id)) return null;

        const hasChildren = tagsByParent.has(tag.id);
        const isExpanded = expandedTags.has(tag.id) || !!searchQuery;
        const isSelected = selectedTagId === tag.id;

        return (
            <div key={tag.id}>
                <div
                    className={cn(
                        "flex items-center w-full hover:bg-accent rounded-sm transition-colors group/row select-none cursor-pointer px-2 py-1.5",
                        isSelected && "bg-accent"
                    )}
                    onClick={() => onSelect(tag.id)}
                >
                    <div 
                        className="flex-1 flex items-center gap-2 min-w-0"
                        style={{ paddingLeft: `${depth * 12}px` }}
                    >
                        <div
                            className={cn(
                                "w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted transition-colors",
                                !hasChildren && "opacity-0 pointer-events-none"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(e, tag.id);
                            }}
                        >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </div>
                        <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}>
                            <Check className="h-3 w-3" />
                        </div>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                        <span className={cn(
                            "text-xs font-medium truncate",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {tag.name}
                        </span>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-2 border-l border-border/50">
                        {renderTree(tag.id, depth + 1)}
                    </div>
                )}
            </div>
        );
    });
  };

  return (
    <div className="w-56 flex flex-col">
        <div className="px-2 py-1.5 flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Set Project</div>
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-xs bg-muted/50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>
        </div>

        <Separator />

        <div className="max-h-64 overflow-y-auto no-scrollbar p-1">
            {!searchQuery && (
                <div
                    className={cn(
                        "flex items-center w-full hover:bg-accent rounded-sm transition-colors group/row select-none cursor-pointer px-2 py-1.5 mb-1",
                        selectedTagId === '' && "bg-accent"
                    )}
                    onClick={() => onSelect('')}
                >
                    <div className="flex-1 flex items-center gap-2">
                        <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedTagId === '' ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}>
                            <Check className="h-3 w-3" />
                        </div>
                        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground"><Hash size={12} /></div>
                        <span className={cn(
                            "text-xs font-medium truncate",
                            selectedTagId === '' ? "text-foreground" : "text-muted-foreground"
                        )}>
                            Inbox
                        </span>
                    </div>
                </div>
            )}

            {tags.length > 0 ? renderTree(null) : (
                <p className="text-[10px] text-muted-foreground/60 p-4 text-center italic">No projects found.</p>
            )}
        </div>

        {selectedTagId && (
            <>
                <Separator />
                <div className="p-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect('');
                        }}
                        className="flex items-center justify-center w-full px-2 py-1.5 text-xs hover:bg-accent rounded-sm transition-colors"
                    >
                        Clear selection
                    </button>
                </div>
            </>
        )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Tag } from '@/entities/tag';
import { Check, ChevronRight, ChevronDown, Hash, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/ui/input';

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
   * Auto-expand to show selected tag in the hierarchy.
   */
  useEffect(() => {
    if (selectedTagId) {
        const parentIds = new Set<string>();
        let current = tags.find(t => t.id === selectedTagId);
        while (current && current.parentId) {
            parentIds.add(current.parentId);
            current = tags.find(t => t.id === current.parentId);
        }
        setExpandedTags(prev => new Set([...Array.from(prev), ...Array.from(parentIds)]));
    }
  }, [selectedTagId, tags]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(expandedTags);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTags(newSet);
  };

  const filteredTags = searchQuery
    ? tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tags;

  /**
   * Recursive function to render the tag tree branches.
   */
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const children = filteredTags.filter(t => t.parentId === parentId).sort((a, b) => a.order - b.order);
    if (children.length === 0) return null;

    return children.map(tag => {
        const hasChildren = tags.some(t => t.parentId === tag.id);
        const isExpanded = expandedTags.has(tag.id) || !!searchQuery;
        const isSelected = selectedTagId === tag.id;

        return (
            <div key={tag.id}>
                <div
                    className={cn(
                        "flex items-center w-full hover:bg-accent rounded-md transition-colors group/row select-none cursor-pointer px-2 py-1.5",
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
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                        <span className={cn(
                            "text-xs font-medium truncate",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {tag.name}
                        </span>
                    </div>
                    {isSelected && <Check size={12} className="text-primary shrink-0 ml-2" />}
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
    <div className="w-56 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Set Project</div>

        <div className="relative mb-1">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-7 text-xs bg-muted/50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
            />
        </div>

        <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
            {!searchQuery && (
                <div
                    className={cn(
                        "flex items-center w-full hover:bg-accent rounded-md transition-colors group/row select-none cursor-pointer px-2 py-1.5 mb-1",
                        selectedTagId === '' && "bg-accent"
                    )}
                    onClick={() => onSelect('')}
                >
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground"><Hash size={12} /></div>
                        <span className={cn(
                            "text-xs font-medium",
                            selectedTagId === '' ? "text-foreground" : "text-muted-foreground"
                        )}>
                            Inbox
                        </span>
                    </div>
                    {selectedTagId === '' && <Check size={12} className="text-primary shrink-0" />}
                </div>
            )}

            {tags.length > 0 ? renderTree(null) : (
                <p className="text-[10px] text-muted-foreground/60 p-4 text-center italic">No projects found.</p>
            )}
        </div>
    </div>
  );
};

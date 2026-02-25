import React, { useState, useEffect } from 'react';
import { Tag } from '../../types';
import { Check, ChevronRight, ChevronDown, Hash } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

/**
 * Interface for TagPicker props.
 */
interface TagPickerProps {
  /** Full list of tags to display in the tree. */
  tags: Tag[];
  /** The currently selected tag ID (empty string for Inbox). */
  selectedTagId: string;
  /** Callback triggered when a tag is selected. */
  onSelect: (tagId: string) => void;
}

/**
 * A hierarchical tree-based picker for selecting a task's project (Tag).
 * It supports nested levels and includes an "Inbox" (no-tag) option.
 *
 * @component
 * @interaction
 * - Automatically expands the tree branches to reveal the currently selected tag on mount.
 * - Allows toggling branch expansion without selecting a tag.
 * - Displays a checkmark indicator for the active selection.
 */
export const TagPicker: React.FC<TagPickerProps> = ({ tags, selectedTagId, onSelect }) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

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

  /**
   * Recursive function to render the tag tree branches.
   */
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const children = tags.filter(t => t.parentId === parentId).sort((a, b) => a.order - b.order);
    if (children.length === 0) return null;

    return children.map(tag => {
        const hasChildren = tags.some(t => t.parentId === tag.id);
        const isExpanded = expandedTags.has(tag.id);
        const isSelected = selectedTagId === tag.id;

        return (
            <div key={tag.id}>
                <div className="flex items-center w-full hover:bg-foreground/10 rounded-lg transition-colors group/row select-none">
                    <div 
                        className="flex-1 flex items-center gap-1.5 py-1.5 cursor-pointer min-w-0"
                        style={{ paddingLeft: `${8 + (depth * 10)}px` }}
                        onClick={(e) => {
                            if (hasChildren) toggleExpand(e, tag.id);
                            else onSelect(tag.id);
                        }}
                    >
                        <div className={`w-3 h-3 flex items-center justify-center text-secondary ${hasChildren ? 'opacity-100' : 'opacity-0'}`}>
                            {isExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-foreground' : 'text-secondary'}`}>{tag.name}</span>
                    </div>
                    <div className="px-2 py-1.5 cursor-pointer" onClick={() => onSelect(tag.id)}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border group-hover/row:border-foreground/40 bg-foreground/5'}`}>
                            {isSelected && <Check size={10} className="text-background" strokeWidth={3} />}
                        </div>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="border-l border-border ml-3 my-0.5">
                        {renderTree(tag.id, depth + 1)}
                    </div>
                )}
            </div>
        );
    });
  };

  return (
    <PickerContainer title="Set Project" className="w-48">
        <div className="max-h-64 overflow-y-auto no-scrollbar">
            {/* Global Inbox Option */}
            <div className="flex items-center w-full hover:bg-foreground/10 rounded-lg transition-colors group/row select-none" onClick={() => onSelect('')}>
                <div className="flex-1 flex items-center gap-2 py-1.5 pl-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-foreground/5 text-secondary"><Hash size={10} /></div>
                    <span className={`text-xs font-medium ${selectedTagId === '' ? 'text-foreground' : 'text-secondary'}`}>Inbox</span>
                </div>
                <div className="px-2 py-1.5">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedTagId === '' ? 'bg-primary border-primary' : 'border-border group-hover/row:border-foreground/40 bg-foreground/5'}`}>
                        {selectedTagId === '' && <Check size={10} className="text-background" strokeWidth={3} />}
                    </div>
                </div>
            </div>

            {tags.length > 0 ? renderTree(null) : (
                <p className="text-xs text-secondary/50 p-2 text-center">No projects found.</p>
            )}
        </div>
    </PickerContainer>
  );
};

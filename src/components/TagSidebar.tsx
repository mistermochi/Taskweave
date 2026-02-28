'use client';

import React, { useState, useRef } from 'react';
import { Tag, tagApi } from '@/entities/tag';
import { TaskEntity } from '@/entities/task';
import { ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import { Flyout } from '@/shared/ui/ui/popover';
import { TagEditPicker } from '@/components/pickers/TagEditPicker';

/**
 * Interface for TagTree props.
 */
interface TagTreeProps {
  /** Full list of tags from the database. */
  tags: Tag[];
  /** Full list of tasks for calculating counts (future). */
  tasks: TaskEntity[];
  /** The currently selected tag ID. */
  activeTagId: string | null;
  /** Callback triggered when a tag is clicked. */
  onSelectTag: (tagId: string | null) => void;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * A recursive, interactive tree component for managing hierarchical tags.
 * Supports expanding/collapsing sub-tags, drag-and-drop re-parenting,
 * and inline editing via a flyout.
 *
 * @component
 */
export const TagTree: React.FC<TagTreeProps> = ({ tags, tasks, activeTagId, onSelectTag, className = '' }) => {
  /** Set of IDs for tags that are currently expanded. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  /** ID of the tag currently being dragged. */
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  
  /** The tag currently being modified in the edit flyout. */
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  /** Reference to the button that triggered the edit flyout. */
  const triggerElRef = useRef<HTMLElement | null>(null);


  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  /**
   * Initializes the native HTML drag event.
   */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTagId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handles the drop event to move a tag to a new parent.
   */
  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId && sourceId !== targetId) {
        await tagApi.moveTag(sourceId, targetId);
    }
    setDraggedTagId(null);
  };

  const handleSaveEdit = async (id: string, name: string, color: string) => {
    await tagApi.updateTag(id, { name, color });
    setEditingTag(null);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  /**
   * Recursive function to generate the tree structure from the flat tag list.
   */
  const buildTree = (parentId: string | null) => {
    return tags
      .filter(t => t.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(tag => {
        const hasChildren = tags.some(t => t.parentId === tag.id);
        const isExpanded = expanded.has(tag.id);
        const isActive = activeTagId === tag.id;

        return (
          <div key={tag.id} className="pl-2">
             <div 
                className={`
                    group flex items-center gap-2 py-1.5 pr-2 rounded-md cursor-pointer transition-all relative select-none
                    ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50'}
                    ${draggedTagId === tag.id ? 'opacity-50' : 'opacity-100'}
                `}
                onClick={() => onSelectTag(tag.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, tag.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => { e.stopPropagation(); handleDrop(e, tag.id); }}
             >
                <button 
                    onClick={(e) => toggleExpand(tag.id, e)}
                    className={`p-1 rounded-md hover:bg-sidebar-accent transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundColor: tag.color }}></span>
                    <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>{tag.name}</span>
                </div>
                
                <div className="relative ml-auto flex items-center">
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingTag && editingTag.id === tag.id) {
                              setEditingTag(null);
                          } else {
                              setEditingTag(tag);
                              triggerElRef.current = e.currentTarget;
                          }
                        }}
                        className="p-1 rounded-md hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-all text-sidebar-foreground/50 hover:text-sidebar-foreground"
                    >
                        <Edit2 size={12} />
                    </button>
                </div>
             </div>

             {hasChildren && isExpanded && (
                 <div className="border-l border-sidebar-border/50 ml-3.5 mt-0.5 mb-1 space-y-0.5">
                     {buildTree(tag.id)}
                 </div>
             )}
          </div>
        );
      });
  };

  return (
    <div className={`overflow-y-auto no-scrollbar ${className}`}>
        {/* Root Drop Zone: Allows dragging tags back to the top level */}
        <div 
            className="mb-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 border-2 border-dashed border-transparent hover:border-border rounded-sm transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
        >
            Drop to Root
        </div>

        {buildTree(null)}

        <Flyout
            isOpen={!!editingTag}
            onClose={handleCancelEdit}
            triggerEl={triggerElRef.current}
            position="right"
        >
            {editingTag && (
                <TagEditPicker 
                    tag={editingTag} 
                    allTags={tags}
                    allTasks={tasks}
                    onSave={handleSaveEdit} 
                    onCancel={handleCancelEdit} 
                />
            )}
        </Flyout>
    </div>
  );
};

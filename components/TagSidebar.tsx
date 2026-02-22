
'use client';

import React, { useState, useRef } from 'react';
import { Tag, TaskEntity } from '@/types';
import { TagService } from '@/services/TagService';
import { ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import Flyout from '@/components/ui/Flyout';
import { TagEditPicker } from '@/components/pickers/TagEditPicker';

interface TagTreeProps {
  tags: Tag[];
  tasks: TaskEntity[];
  activeTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  className?: string;
}

export const TagTree: React.FC<TagTreeProps> = ({ tags, tasks, activeTagId, onSelectTag, className = '' }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);


  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTagId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId && sourceId !== targetId) {
        await TagService.getInstance().moveTag(sourceId, targetId);
    }
    setDraggedTagId(null);
  };

  const handleSaveEdit = async (id: string, name: string, color: string) => {
    await TagService.getInstance().updateTag(id, { name, color });
    setEditingTag(null);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const buildTree = (parentId: string | null) => {
    return tags
      .filter(t => t.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(tag => {
        const hasChildren = tags.some(t => t.parentId === tag.id);
        const isExpanded = expanded.has(tag.id);
        const isActive = activeTagId === tag.id;

        return (
          <div key={tag.id} className="pl-3">
             <div 
                className={`
                    group flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors relative select-none
                    ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-foreground hover:bg-foreground/5'}
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
                    className={`p-0.5 rounded hover:bg-foreground/10 ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                    <span className="text-sm font-medium truncate">{tag.name}</span>
                </div>
                
                <div className="relative ml-auto">
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
                        className="p-1 rounded hover:bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 size={12} />
                    </button>
                </div>
             </div>

             {hasChildren && isExpanded && (
                 <div className="border-l border-border ml-3">
                     {buildTree(tag.id)}
                 </div>
             )}
          </div>
        );
      });
  };

  return (
    <div className={`overflow-y-auto no-scrollbar ${className}`}>
        {/* Root Drop Zone */}
        <div 
            className="mb-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary/30 border-2 border-dashed border-transparent hover:border-border rounded-lg transition-colors"
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

'use client';

import React, { useState, useMemo } from 'react';
import { Tag, TaskEntity } from '@/types';
import { Trash2, AlertTriangle } from 'lucide-react';
import { TagService } from '@/services/TagService';

interface TagEditPickerProps {
    tag: Tag;
    allTags: Tag[];
    allTasks: TaskEntity[];
    onSave: (id: string, name: string, color: string) => void;
    onCancel: () => void;
}

const COLORS = ['#9333ea', '#d97706', '#16a34a', '#0284c7', '#db2777', '#dc2626', '#7c3aed', '#ca8a04'];

export const TagEditPicker: React.FC<TagEditPickerProps> = ({ tag, allTags, allTasks, onSave, onCancel }) => {
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const relatedCounts = useMemo(() => {
        const taskCount = allTasks.filter(t => t.category === tag.id).length;
        const subProjectCount = allTags.filter(t => t.parentId === tag.id).length;
        return { taskCount, subProjectCount };
    }, [tag.id, allTasks, allTags]);

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (name.trim()) {
            onSave(tag.id, name.trim(), color);
        }
    };

    const handleStartDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmingDelete(true);
    };

    const handleConfirmDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await TagService.getInstance().deleteTag(tag.id);
        onCancel(); // Close picker on success
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmingDelete(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCancel();
    };

    if (isConfirmingDelete) {
        return (
            <div className="w-56 p-1" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={24} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-foreground mb-1">Delete Project?</div>
                        <div className="text-xs text-secondary/80 space-y-1">
                            {relatedCounts.taskCount > 0 && <p>• {relatedCounts.taskCount} task(s) will move to Inbox.</p>}
                            {relatedCounts.subProjectCount > 0 && <p>• {relatedCounts.subProjectCount} sub-project(s) will move to root.</p>}
                            <p>This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                    <button onClick={handleCancelDelete} className="px-3 py-1.5 text-xs text-secondary font-bold hover:bg-foreground/10 rounded-md">Cancel</button>
                    <button onClick={handleConfirmDelete} className="px-3 py-1.5 text-xs text-white font-bold bg-red-500 hover:bg-red-600 rounded-md">Delete</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-56" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="text-xs font-bold text-secondary uppercase tracking-wider">Edit Project</div>
                <button 
                    onClick={handleStartDelete}
                    className="p-1.5 rounded-md text-secondary/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Delete Project"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (name.trim()) onSave(tag.id, name.trim(), color); }}}
                className="w-full bg-foreground/5 border border-border rounded-lg px-2 py-1.5 text-foreground text-sm focus:border-primary/50 outline-none mb-3"
                autoFocus
            />
            <div className="grid grid-cols-4 gap-2 mb-3">
                {COLORS.map(c => (
                    <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-full h-8 rounded-lg border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="flex items-center justify-end gap-2">
                <button onClick={handleCancel} className="px-3 py-1.5 text-xs text-secondary font-bold hover:bg-foreground/10 rounded-md">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 text-xs text-background font-bold bg-primary hover:bg-primary-dim rounded-md">Save</button>
            </div>
        </div>
    );
};

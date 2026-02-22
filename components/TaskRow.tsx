
'use client';

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Check, Trash2, Lock } from 'lucide-react';
import { TaskEntity, Tag, RecurrenceConfig, EnergyLevel } from '@/types';
import { calculateTaskTime, formatTimer } from '@/utils/timeUtils';
import { parseTaskInput } from '@/utils/textParserUtils';
import { TagService } from '@/services/TagService';
import { TaskDisplay } from '@/components/task-row/TaskDisplay';
import { TaskInput } from '@/components/task-row/TaskInput';
import { TaskRowPickers } from '@/components/task-row/TaskRowPickers';
import { TaskRowActions } from '@/components/task-row/TaskRowActions';

interface TaskRowProps {
    task: TaskEntity;
    allTasks: TaskEntity[];
    tags: Tag[];
    onComplete: (task: TaskEntity) => void;
    onFocus: (task: TaskEntity) => void;
    onScheduleToday?: (task: TaskEntity) => void;
    onDelete?: (id: string) => void;
    onUpdate?: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
    onArchive?: (task: TaskEntity) => void;
    highlight?: boolean; 
    initialIsEditing?: boolean;
    onDiscard?: () => void;
    onSelect?: (task: TaskEntity) => void;
    isSelected?: boolean;
}

const TaskRowComponent: React.FC<TaskRowProps> = ({ 
    task, allTasks, tags, onComplete, onFocus, onScheduleToday, onDelete, onUpdate, onArchive, highlight,
    initialIsEditing = false,
    onDiscard,
    onSelect,
    isSelected
}) => {
    // --- Display Logic ---
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    
    const activeBlockers = useMemo(() => {
        if (!task.blockedBy || task.blockedBy.length === 0 || !allTasks) return [];
        return task.blockedBy.map(id => allTasks.find(t => t.id === id)).filter(t => t && t.status !== 'completed');
    }, [task.blockedBy, allTasks]);
    
    const isBlocked = activeBlockers.length > 0;
    const isOverdue = task.dueDate && task.dueDate < Date.now() && !isCompleted && !isArchived;

    const displayedDuration = useMemo(() => {
        if (isCompleted && typeof task.actualDuration === 'number') {
            return Math.max(1, Math.round(task.actualDuration / 60));
        }
        return task.duration;
    }, [isCompleted, task.actualDuration, task.duration]);

    // --- Timer Logic ---
    const [timeDisplay, setTimeDisplay] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);

    useEffect(() => {
        if (!task.isFocused) {
            setTimeDisplay(null);
            setIsRunning(false);
            return;
        }
        const updateTimer = () => {
            const metrics = calculateTaskTime(task);
            setTimeDisplay(formatTimer(metrics.remaining));
            setIsRunning(metrics.status === 'running');
            setIsOvertime(metrics.isOvertime);
        };
        updateTimer();
        if (task.lastStartedAt) {
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [task, task.isFocused, task.lastStartedAt, task.remainingSeconds]);

    // --- Edit & Interaction State ---
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isDeletePending, setIsDeletePending] = useState(false);
    const [isHoverCapable, setIsHoverCapable] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Drafts
    const [titleDraft, setTitleDraft] = useState(task.title);
    const [notesDraft, setNotesDraft] = useState(task.notes || "");
    const [tagDraft, setTagDraft] = useState(task.category);
    const [durationDraft, setDurationDraft] = useState(task.duration);
    const [energyDraft, setEnergyDraft] = useState<EnergyLevel>(task.energy);
    const [dueDateDraft, setDueDateDraft] = useState<number | undefined>(task.dueDate);
    const [assignedDateDraft, setAssignedDateDraft] = useState<number | undefined>(task.assignedDate);
    const [recurrenceDraft, setRecurrenceDraft] = useState<RecurrenceConfig | undefined>(task.recurrence);
    const [blockedByDraft, setBlockedByDraft] = useState<string[]>(task.blockedBy || []);

    // Selection mode state
    const isSelectionMode = !!onSelect;
    const isCheckedForDisplay = isSelectionMode ? (isSelected ?? false) : (isCompleted || isCompleting);

    // Detect Input Capability
    useEffect(() => {
        const checkHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        setIsHoverCapable(checkHover());
    }, []);

    // Sync draft on open
    useEffect(() => {
        if (isEditing && !initialIsEditing) {
            setTitleDraft(task.title);
            setNotesDraft(task.notes || "");
            setTagDraft(task.category);
            setDurationDraft(task.duration);
            setEnergyDraft(task.energy);
            setDueDateDraft(task.dueDate);
            setAssignedDateDraft(task.assignedDate);
            setRecurrenceDraft(task.recurrence);
            setBlockedByDraft(task.blockedBy || []);
        }
        if (isEditing) setIsDeletePending(false);
    }, [isEditing, task, initialIsEditing]);

    // --- NLP Parsing ---
    const parsedInput = useMemo(() => {
        if (!isEditing) return null;
        return parseTaskInput(titleDraft);
    }, [titleDraft, isEditing]);

    // Computed Effective Values
    const effectiveTagId = useMemo(() => {
        if (parsedInput?.attributes.tagKeyword) {
            const match = tags.find(t => t.name.toLowerCase() === parsedInput.attributes.tagKeyword);
            return match ? match.id : tagDraft;
        }
        return tagDraft;
    }, [parsedInput, tags, tagDraft]);

    const effectiveDuration = parsedInput?.attributes.duration ?? durationDraft;
    const effectiveEnergy = parsedInput?.attributes.energy ?? energyDraft;
    const effectiveAssignedDate = parsedInput?.attributes.assignedDate ?? assignedDateDraft;
    const effectiveDueDate = parsedInput?.attributes.dueDate ?? dueDateDraft;
    const effectiveRecurrence = parsedInput?.attributes.recurrence ?? recurrenceDraft;

    // Ensure visibility when entering edit mode
    useEffect(() => {
        if (isEditing && containerRef.current) {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        }
    }, [isEditing]);
    
    // Delayed completion for animation
    useEffect(() => {
        if (isCompleting && !isSelectionMode) {
            const timer = setTimeout(() => {
                onComplete(task);
            }, 300); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isCompleting, onComplete, task, isSelectionMode]);

    // Click Outside Handling
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            // Check if the click happened inside a flyout. If so, do nothing.
            if ((target as HTMLElement).closest('[data-flyout-container]')) {
                return;
            }

            if (containerRef.current && !containerRef.current.contains(target)) {
                if (isEditing) saveChanges();
                else if (showActions) setShowActions(false);
                setIsDeletePending(false);
            }
        };
        if (isEditing || showActions || isDeletePending) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isEditing, showActions, isDeletePending, titleDraft, notesDraft, effectiveDuration, effectiveEnergy, effectiveDueDate, effectiveAssignedDate, effectiveRecurrence, effectiveTagId, blockedByDraft]);


    const handleRowClick = () => {
        if (isSelectionMode) {
            onSelect?.(task);
            return;
        }
        if (isEditing || isCompleted || isArchived) return;
        if (isHoverCapable) enterEditMode();
        else {
            if (showActions) enterEditMode();
            else setShowActions(true);
        }
    };

    const enterEditMode = () => {
        if (onUpdate && !isCompleted && !isArchived) setIsEditing(true);
        setShowActions(false); 
    };

    const saveChanges = async () => {
        const finalTitle = parsedInput ? (parsedInput.cleanTitle || titleDraft) : titleDraft;
        const cleanTitle = finalTitle.trim();

        if (!cleanTitle) {
            if (onDiscard) onDiscard();
            else {
                setIsEditing(false);
                setTitleDraft(task.title);
            }
            return;
        }

        let finalTagId = effectiveTagId;
        
        if (parsedInput?.attributes.tagKeyword) {
             const keyword = parsedInput.attributes.tagKeyword;
             const existing = tags.find(t => t.name.toLowerCase() === keyword);
             if (!existing) {
                 try {
                     const name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                     finalTagId = await TagService.getInstance().createTag(name, null);
                 } catch(e) {}
             }
        }

        let finalRecurrence = effectiveRecurrence;
        if (finalRecurrence?.frequency === 'weekly' && (!finalRecurrence.weekDays || finalRecurrence.weekDays.length === 0)) {
            finalRecurrence = undefined;
        }

        const hasChanges = 
            cleanTitle !== task.title || 
            notesDraft.trim() !== (task.notes || "") || 
            effectiveDuration !== task.duration ||
            effectiveEnergy !== task.energy ||
            effectiveDueDate !== task.dueDate ||
            effectiveAssignedDate !== task.assignedDate ||
            JSON.stringify(finalRecurrence) !== JSON.stringify(task.recurrence) ||
            finalTagId !== task.category ||
            JSON.stringify(blockedByDraft) !== JSON.stringify(task.blockedBy || []);

        if (hasChanges && onUpdate) {
            onUpdate(task, {
                title: cleanTitle,
                notes: notesDraft.trim(),
                duration: effectiveDuration,
                energy: effectiveEnergy,
                dueDate: effectiveDueDate ?? null as any,
                assignedDate: effectiveAssignedDate ?? null as any,
                recurrence: (effectiveDueDate ? finalRecurrence : undefined) ?? null as any,
                category: finalTagId,
                blockedBy: blockedByDraft,
            });
        }

        if (!onDiscard) setIsEditing(false);
    };

    const draftTagColor = tags.find(t => t.id === effectiveTagId)?.color || '#8a9e91';
    const draftTagName = tags.find(t => t.id === effectiveTagId)?.name || 'Inbox';
    const tagName = tags.find(t => t.id === task.category)?.name || 'Inbox';
    const tagColor = tags.find(t => t.id === task.category)?.color || '#8a9e91';

    return (
        <div 
            ref={containerRef}
            className={`
                group flex items-start gap-3 py-3 border-b border-border last:border-0 transition-all duration-300 relative
                ${isBlocked && !isEditing ? 'opacity-50' : ''}
                ${(isCompleted || isArchived) && !isSelectionMode ? 'cursor-default' : 'cursor-pointer'}
                ${isCompleting ? 'opacity-0' : ''}
                ${highlight ? 'bg-primary/5' : (isCheckedForDisplay && isSelectionMode) ? 'bg-surface-highlight' : ''}
                ${(isCompleted || isArchived || isEditing || (isCheckedForDisplay && isSelectionMode)) ? '' : 'hover:bg-foreground/5'}
                ${isCompleted ? 'opacity-60 hover:opacity-100' : ''}
                ${isEditing ? 'bg-foreground/[0.08] shadow-xl z-10 px-4 py-4 border-transparent ring-1 ring-border rounded-2xl' : 'px-3'}
                ${showActions ? 'bg-foreground/5' : ''}
            `}
            onClick={handleRowClick}
        >
            <button 
                aria-label={isArchived ? (isDeletePending ? 'Confirm delete' : 'Delete permanently') : 'Complete task'}
                onClick={(e) => { 
                    e.stopPropagation();
                    if (isBlocked && !isArchived) return;

                    if (isSelectionMode) {
                        onSelect?.(task);
                        return;
                    }

                    if (isArchived) {
                        if (isDeletePending) {
                            if (onDelete) onDelete(task.id);
                        } else {
                            setIsDeletePending(true);
                            setTimeout(() => setIsDeletePending(false), 3000);
                        }
                    } else if (!isCompleting) {
                        setIsCompleting(true);
                    }
                }}
                disabled={isBlocked && !isArchived}
                className={`mt-0.5 w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200 group/check
                    ${isBlocked && !isArchived
                        ? 'border-secondary/20 bg-transparent'
                        : isArchived 
                            ? isDeletePending
                                ? 'bg-red-500 border-red-500 text-white' 
                                : 'border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500' 
                            : isCheckedForDisplay
                                ? 'bg-primary border-primary text-primary-foreground' 
                                : (highlight ? 'border-primary hover:bg-primary/20' : 'border-secondary/40 hover:border-primary')
                    }
                `}
            >
                {isBlocked && !isArchived ? (
                    <div title={`Blocked by: ${activeBlockers.map(b => b?.title).join(', ')}`}>
                        <Lock size={10} className="text-secondary/50" />
                    </div>
                ) : isArchived && !isSelectionMode ? (
                    <Trash2 size={isDeletePending ? 12 : 10} className={`${isDeletePending ? 'opacity-100' : 'opacity-70 group-hover/check:opacity-100'}`} />
                ) : (
                    <Check size={12} className={(isCheckedForDisplay) ? 'opacity-100' : 'opacity-0 group-hover/check:opacity-100 text-primary'} />
                )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col">
                {isEditing ? (
                    <TaskInput 
                        title={titleDraft}
                        notes={notesDraft}
                        onTitleChange={setTitleDraft}
                        onNotesChange={setNotesDraft}
                        onSaveChanges={saveChanges}
                        onDiscard={() => { if(onDiscard) onDiscard(); else setIsEditing(false); }}
                        isEditing={isEditing}
                    />
                ) : (
                    <TaskDisplay title={task.title} notes={task.notes} isCompleted={isCompleted || isCompleting} />
                )}

                <TaskRowPickers 
                    task={task}
                    allTasks={allTasks}
                    tags={tags}
                    effectiveTagId={isEditing ? effectiveTagId : task.category}
                    effectiveDuration={isEditing ? effectiveDuration : displayedDuration}
                    effectiveEnergy={isEditing ? effectiveEnergy : task.energy}
                    effectiveAssignedDate={isEditing ? effectiveAssignedDate : task.assignedDate}
                    effectiveDueDate={isEditing ? effectiveDueDate : task.dueDate}
                    effectiveRecurrence={isEditing ? effectiveRecurrence : task.recurrence}
                    effectiveBlockedBy={isEditing ? blockedByDraft : (task.blockedBy || [])}
                    onTagChange={setTagDraft}
                    onDurationChange={setDurationDraft}
                    onEnergyChange={setEnergyDraft}
                    onAssignedDateChange={setAssignedDateDraft}
                    onDueDateChange={setDueDateDraft}
                    onRecurrenceChange={setRecurrenceDraft}
                    onBlockedByChange={setBlockedByDraft}
                    isEditing={isEditing}
                    isOverdue={isOverdue}
                    tagName={isEditing ? draftTagName : tagName}
                    tagColor={isEditing ? draftTagColor : tagColor}
                    isFocused={!!task.isFocused}
                    timeDisplay={timeDisplay}
                    isRunning={isRunning}
                />
            </div>

            {!isSelectionMode && (
                <TaskRowActions
                    task={task}
                    isEditing={isEditing}
                    isArchived={isArchived}
                    isCompleted={isCompleted}
                    isBlocked={isBlocked}
                    showActions={showActions}
                    isHoverCapable={isHoverCapable}
                    onScheduleToday={onScheduleToday}
                    onArchive={onArchive}
                    onComplete={onComplete}
                    onFocus={onFocus}
                    onSave={saveChanges}
                    onEnterEditMode={enterEditMode}
                />
            )}
        </div>
    );
};

const arePropsEqual = (prevProps: TaskRowProps, nextProps: TaskRowProps) => {
    if (prevProps.highlight !== nextProps.highlight) return false;
    if (prevProps.initialIsEditing !== nextProps.initialIsEditing) return false;
    if (prevProps.onDiscard !== nextProps.onDiscard) return false;
    if (prevProps.task !== nextProps.task) return false;
    if (prevProps.allTasks !== nextProps.allTasks) return false;
    if (prevProps.tags !== nextProps.tags) return false;
    if (prevProps.onComplete !== nextProps.onComplete) return false;
    if (prevProps.onFocus !== nextProps.onFocus) return false;
    if (prevProps.onUpdate !== nextProps.onUpdate) return false;
    if (prevProps.onDelete !== nextProps.onDelete) return false;
    if (prevProps.onScheduleToday !== nextProps.onScheduleToday) return false;
    if (prevProps.onArchive !== nextProps.onArchive) return false;
    if (prevProps.onSelect !== nextProps.onSelect) return false;
    if (prevProps.isSelected !== nextProps.isSelected) return false;
    return true;
};

export const TaskRow = memo(TaskRowComponent, arePropsEqual);

import { useState, useEffect, useCallback } from 'react';
import { TaskEntity, RecurrenceConfig, EnergyLevel } from '../types';

interface UseTaskEditStateOptions {
    task: TaskEntity;
    initialIsEditing: boolean;
    onUpdate?: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
    onComplete?: (task: TaskEntity) => void;
}

interface UseTaskEditStateResult {
    isEditing: boolean;
    setIsEditing: (value: boolean | ((prev: boolean) => boolean)) => void;
    drafts: {
        title: string;
        notes: string;
        tag: string;
        duration: number;
        energy: EnergyLevel;
        dueDate: number | undefined;
        assignedDate: number | undefined;
        recurrence: RecurrenceConfig | undefined;
        blockedBy: string[];
    };
    setDrafts: React.Dispatch<React.SetStateAction<UseTaskEditStateResult['drafts']>>;
    saveChanges: () => void;
    effectiveValues: {
        tagId: string;
        duration: number;
        energy: EnergyLevel;
        assignedDate: number | undefined;
        dueDate: number | undefined;
        recurrence: RecurrenceConfig | undefined;
        blockedBy: string[];
    };
}

export const useTaskEditState = (
    task: TaskEntity,
    initialIsEditing: boolean,
    onUpdate?: (task: TaskEntity, updates: Partial<TaskEntity>) => void,
    onComplete?: (task: TaskEntity) => void
): UseTaskEditStateResult => {
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [titleDraft, setTitleDraft] = useState(task.title);
    const [notesDraft, setNotesDraft] = useState(task.notes || "");
    const [tagDraft, setTagDraft] = useState(task.category);
    const [durationDraft, setDurationDraft] = useState(task.duration);
    const [energyDraft, setEnergyDraft] = useState<EnergyLevel>(task.energy);
    const [dueDateDraft, setDueDateDraft] = useState<number | undefined>(task.dueDate);
    const [assignedDateDraft, setAssignedDateDraft] = useState<number | undefined>(task.assignedDate);
    const [recurrenceDraft, setRecurrenceDraft] = useState<RecurrenceConfig | undefined>(task.recurrence);
    const [blockedByDraft, setBlockedByDraft] = useState<string[]>(task.blockedBy || []);

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
    }, [isEditing, task, initialIsEditing]);

    const saveChanges = useCallback(() => {
        if (onUpdate) {
            onUpdate(task, {
                title: titleDraft.trim(),
                notes: notesDraft.trim(),
                duration: durationDraft,
                energy: energyDraft,
                dueDate: dueDateDraft ?? undefined,
                assignedDate: assignedDateDraft ?? undefined,
                recurrence: (dueDateDraft ? recurrenceDraft : undefined) ?? undefined,
                category: tagDraft,
                blockedBy: blockedByDraft,
            });
        }
    }, [task, onUpdate, titleDraft, notesDraft, durationDraft, energyDraft, dueDateDraft, assignedDateDraft, recurrenceDraft, tagDraft, blockedByDraft]);

    return {
        isEditing,
        setIsEditing,
        drafts: {
            title: titleDraft,
            notes: notesDraft,
            tag: tagDraft,
            duration: durationDraft,
            energy: energyDraft,
            dueDate: dueDateDraft,
            assignedDate: assignedDateDraft,
            recurrence: recurrenceDraft,
            blockedBy: blockedByDraft,
        },
        setDrafts: (updater) => {
            if (typeof updater === 'function') {
                const newDrafts = updater({ title: titleDraft, notes: notesDraft, tag: tagDraft, duration: durationDraft, energy: energyDraft, dueDate: dueDateDraft, assignedDate: assignedDateDraft, recurrence: recurrenceDraft, blockedBy: blockedByDraft });
                setTitleDraft(newDrafts.title);
                setNotesDraft(newDrafts.notes);
                setTagDraft(newDrafts.tag);
                setDurationDraft(newDrafts.duration);
                setEnergyDraft(newDrafts.energy);
                setDueDateDraft(newDrafts.dueDate);
                setAssignedDateDraft(newDrafts.assignedDate);
                setRecurrenceDraft(newDrafts.recurrence);
                setBlockedByDraft(newDrafts.blockedBy);
            }
        },
        saveChanges,
        effectiveValues: {
            tagId: tagDraft,
            duration: durationDraft,
            energy: energyDraft,
            assignedDate: assignedDateDraft,
            dueDate: dueDateDraft,
            recurrence: recurrenceDraft,
            blockedBy: blockedByDraft,
        },
    };
};

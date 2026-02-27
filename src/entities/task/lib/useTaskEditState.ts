import { useState, useEffect, useCallback } from 'react';
import { TaskEntity, RecurrenceConfig, EnergyLevel } from '../model/types';

/**
 * Interface for the state managed by the task editor hook.
 */
interface UseTaskEditStateResult {
    /** Whether the editor is currently in edit mode. */
    isEditing: boolean;
    setIsEditing: (value: boolean | ((prev: boolean) => boolean)) => void;
    /** Current values of the draft fields in the editor. */
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
    /** Function to update draft fields. */
    setDrafts: React.Dispatch<React.SetStateAction<UseTaskEditStateResult['drafts']>>;
    /** Persists the draft changes to the database. */
    saveChanges: () => void;
    /** Snapshot of the effective values (drafts) for display. */
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

/**
 * Custom hook that manages the temporary state of a task while it's being edited.
 * It provides a "scratchpad" for changes (drafts) before they are committed to Firestore.
 *
 * @param task - The original task being edited.
 * @param initialIsEditing - Initial visibility of the edit interface.
 * @param onUpdate - Callback triggered when changes are saved.
 * @param onComplete - Callback triggered when the task is finalized (currently unused).
 * @returns State and control functions for the task editor.
 */
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newDrafts = (updater as any)({ title: titleDraft, notes: notesDraft, tag: tagDraft, duration: durationDraft, energy: energyDraft, dueDate: dueDateDraft, assignedDate: assignedDateDraft, recurrence: recurrenceDraft, blockedBy: blockedByDraft });
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

import React, { useMemo } from 'react';
import { Hash, CalendarClock, Calendar, Repeat, Clock, Zap, Pause, GitBranch, Share2 } from 'lucide-react';
import { Tag } from '@/entities/tag';
import { TaskEntity, RecurrenceConfig, EnergyLevel } from '@/entities/task';
import { Chip } from './Chip';
import { TagPicker } from '@/components/pickers/TagPicker';
import { DurationPicker } from '@/components/pickers/DurationPicker';
import { EnergyPicker } from '@/components/pickers/EnergyPicker';
import { DatePicker } from '@/components/pickers/DatePicker';
import { RecurrencePicker as RecurrenceInlinePicker } from '@/components/pickers/RecurrencePicker';
import { DependencyPicker } from '@/components/pickers/DependencyPicker';
import { formatRecurrence } from '@/shared/lib/timeUtils';

/**
 * Interface for TaskRowPickers props.
 */
interface TaskRowPickersProps {
    /** The task entity being configured. */
    task: TaskEntity;
    /** All tasks for dependency lookup. */
    allTasks: TaskEntity[];
    /** All available user tags. */
    tags: Tag[];
    /** The tag ID currently in the draft. */
    effectiveTagId: string;
    /** The duration currently in the draft. */
    effectiveDuration: number;
    /** The energy level currently in the draft. */
    effectiveEnergy: EnergyLevel;
    /** The assigned date currently in the draft. */
    effectiveAssignedDate: number | undefined;
    /** The due date currently in the draft. */
    effectiveDueDate: number | undefined;
    /** The recurrence rules currently in the draft. */
    effectiveRecurrence: RecurrenceConfig | undefined;
    /** Array of task IDs currently blocking this task. */
    effectiveBlockedBy: string[];
    /** Callbacks for updating draft state. */
    onTagChange: (tagId: string) => void;
    onDurationChange: (duration: number) => void;
    onEnergyChange: (energy: EnergyLevel) => void;
    onAssignedDateChange: (date: number | undefined) => void;
    onDueDateChange: (date: number | undefined) => void;
    onRecurrenceChange: (recurrence: RecurrenceConfig | undefined) => void;
    onBlockedByChange: (ids: string[]) => void;
    /** Whether the parent row is in edit mode. */
    isEditing: boolean;
    /** Whether the task has passed its due date. */
    isOverdue: boolean;
    /** Resolved display name for the current tag. */
    tagName: string;
    /** Resolved color for the current tag. */
    tagColor: string;
    /** Whether the task is the active focus target. */
    isFocused?: boolean;
    /** Formatted timer display (e.g. "24:59"). */
    timeDisplay?: string | null;
    /** Whether the focus timer is actively running. */
    isRunning?: boolean;
}

/**
 * Orchestrator for all metadata pickers (chips) within a task row.
 * In display mode, it shows a subset of metadata as simple icons/text.
 * In edit mode, it transforms into a row of interactive buttons that open
 * specialized flyout menus.
 *
 * @component
 * @interaction
 * - Manages the visibility of secondary attributes (Dates, Recurrence, Blockers).
 * - Provides live timer feedback if the task is focused.
 * - Displays inverse dependency info ("Blocking X tasks").
 */
export const TaskRowPickers: React.FC<TaskRowPickersProps> = ({ 
    task,
    allTasks,
    tags, 
    effectiveTagId, 
    effectiveDuration, 
    effectiveEnergy, 
    effectiveAssignedDate, 
    effectiveDueDate, 
    effectiveRecurrence, 
    effectiveBlockedBy,
    onTagChange, 
    onDurationChange, 
    onEnergyChange, 
    onAssignedDateChange, 
    onDueDateChange, 
    onRecurrenceChange,
    onBlockedByChange,
    isEditing,
    isOverdue,
    tagName,
    tagColor,
    isFocused,
    timeDisplay,
    isRunning
}) => {
    /**
     * Identifies tasks that this specific task is currently blocking.
     */
    const tasksBeingBlocked = useMemo(() => {
        if (!allTasks) return [];
        return allTasks.filter(t => t.blockedBy?.includes(task.id) && t.status !== 'completed');
    }, [allTasks, task.id]);

    const getEnergyColor = (lvl: EnergyLevel) => {
        switch(lvl) {
            case 'Low': return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'High': return { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
            case 'Medium': 
            default:
                return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
        }
    };
    const energyStyle = getEnergyColor(effectiveEnergy);
    const dependencyCount = effectiveBlockedBy?.length || 0;

    const tagChipButtonStyle = (isEditing && effectiveTagId) ? {
        backgroundColor: `${tagColor}1A`,
        borderColor: `${tagColor}33`,
    } : undefined;

    return (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Project Picker */}
            <Chip 
                icon={Hash}
                label={tagName}
                isEditing={isEditing}
                isActive={!!effectiveTagId}
                iconColor={tagColor}
                labelColor={tagColor}
                bgClass={!effectiveTagId ? 'bg-foreground/5' : undefined}
                borderClass={!effectiveTagId ? 'border-transparent' : undefined}
                colorClass={!effectiveTagId ? 'text-secondary' : undefined}
                buttonStyle={tagChipButtonStyle}
                flyoutContent={(close) => <TagPicker tags={tags} selectedTagId={effectiveTagId} onSelect={(id) => { onTagChange(id); close(); }} />}
            />
            {!isEditing && effectiveTagId && <span className="w-1 h-1 rounded-full bg-secondary/30"></span>}

            {/* Scheduled Date Picker */}
            {(isEditing || effectiveAssignedDate) && (
                <Chip 
                    icon={CalendarClock}
                    label={effectiveAssignedDate ? new Date(effectiveAssignedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "Schedule"}
                    isEditing={isEditing}
                    isActive={!!effectiveAssignedDate}
                    colorClass="text-primary"
                    bgClass="bg-primary/10"
                    borderClass="border-primary/20"
                    flyoutContent={(close) => <DatePicker value={effectiveAssignedDate} onChange={(d) => { onAssignedDateChange(d); close(); }} type="assigned" />}
                />
            )}

            {/* Due Date (Deadline) Picker */}
            {(isEditing || effectiveDueDate) && (
                <Chip 
                    icon={Calendar}
                    label={effectiveDueDate ? new Date(effectiveDueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "Deadline"}
                    isEditing={isEditing}
                    isActive={!!effectiveDueDate}
                    colorClass={isOverdue ? "text-destructive font-bold" : "text-muted-foreground"}
                    bgClass="bg-destructive/10"
                    borderClass="border-destructive/20"
                    flyoutContent={(close) => <DatePicker value={effectiveDueDate} onChange={(d) => { onDueDateChange(d); close(); }} type="due" />}
                />
            )}

            {/* Recurrence Config (Only visible if a due date is set) */}
            {isEditing && effectiveDueDate && (
                <Chip 
                    icon={Repeat}
                    label={effectiveRecurrence ? formatRecurrence(effectiveRecurrence, new Date(effectiveDueDate)) : "Repeat"}
                    isEditing={true}
                    isActive={!!effectiveRecurrence}
                    colorClass={effectiveRecurrence ? "text-primary" : "text-secondary"}
                    bgClass="bg-primary/10"
                    borderClass="border-primary/20"
                    flyoutContent={(close) => <RecurrenceInlinePicker standalone value={effectiveRecurrence} onChange={(r) => { onRecurrenceChange(r); }} baseDate={new Date(effectiveDueDate || Date.now())} />}
                />
            )}
            {!isEditing && effectiveRecurrence && <Repeat size={10} className="text-secondary/50" />}

            {/* Duration Picker / Timer Feedback */}
            {isFocused && !isEditing && timeDisplay ? (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${isRunning ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isRunning ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    ) : (
                        <Pause size={10} className="fill-current" />
                    )}
                    <span className="font-mono">{timeDisplay}</span>
                </div>
            ) : (
                <Chip 
                    icon={Clock}
                    label={`${effectiveDuration}m`}
                    isEditing={isEditing}
                    isActive={true}
                    flyoutContent={(close) => <DurationPicker duration={effectiveDuration} onChange={(d) => { onDurationChange(d); close(); }} />}
                />
            )}

            {/* Energy Level Picker */}
            <Chip 
                icon={Zap}
                label={effectiveEnergy === 'Medium' ? 'Med' : effectiveEnergy}
                isEditing={isEditing}
                isActive={true}
                fill={true}
                colorClass={energyStyle.text}
                bgClass={energyStyle.bg}
                borderClass={energyStyle.border}
                flyoutContent={(close) => <EnergyPicker energy={effectiveEnergy} onChange={(e) => { onEnergyChange(e); close(); }} />}
            />

            {/* Dependency (Blocker) Picker */}
            {(isEditing || dependencyCount > 0) && (
                <Chip
                    icon={GitBranch}
                    label={dependencyCount > 0 ? `${dependencyCount} blocked` : "Blocks"}
                    isEditing={isEditing}
                    isActive={dependencyCount > 0}
                    colorClass={dependencyCount > 0 ? "text-blue-500" : "text-muted-foreground"}
                    bgClass="bg-blue-500/10"
                    borderClass="border-blue-500/20"
                    flyoutContent={(close) => 
                        <DependencyPicker 
                            allTasks={allTasks}
                            currentTaskId={task.id}
                            selectedIds={effectiveBlockedBy}
                            onIdsChange={onBlockedByChange}
                        />
                    }
                />
            )}
            
            {/* Inverse Dependency Status */}
            {!isEditing && tasksBeingBlocked.length > 0 && (
                <div 
                    className="flex items-center gap-1 text-xs text-blue-500 font-medium"
                    title={`Blocking ${tasksBeingBlocked.length} task${tasksBeingBlocked.length > 1 ? 's' : ''}: ${tasksBeingBlocked.map(t => t.title).join(', ')}`}
                >
                    <Share2 size={10} />
                    <span>Blocking {tasksBeingBlocked.length}</span>
                </div>
            )}
        </div>
    );
};

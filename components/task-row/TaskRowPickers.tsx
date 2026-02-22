
import React, { useMemo } from 'react';
import { Hash, CalendarClock, Calendar, Repeat, Clock, Zap, Pause, GitBranch, Share2 } from 'lucide-react';
import { TaskEntity, Tag, RecurrenceConfig, EnergyLevel } from '@/types';
import { Chip } from '@/components/task-row/Chip';
import { TagPicker } from '@/components/pickers/TagPicker';
import { DurationPicker } from '@/components/pickers/DurationPicker';
import { EnergyPicker } from '@/components/pickers/EnergyPicker';
import { DatePicker } from '@/components/pickers/DatePicker';
import { RecurrencePicker as RecurrenceInlinePicker } from '@/components/pickers/RecurrencePicker';
import { DependencyPicker } from '@/components/pickers/DependencyPicker';
import { formatRecurrence } from '@/utils/timeUtils';

interface TaskRowPickersProps {
    task: TaskEntity;
    allTasks: TaskEntity[];
    tags: Tag[];
    effectiveTagId: string;
    effectiveDuration: number;
    effectiveEnergy: EnergyLevel;
    effectiveAssignedDate: number | undefined;
    effectiveDueDate: number | undefined;
    effectiveRecurrence: RecurrenceConfig | undefined;
    effectiveBlockedBy: string[];
    onTagChange: (tagId: string) => void;
    onDurationChange: (duration: number) => void;
    onEnergyChange: (energy: EnergyLevel) => void;
    onAssignedDateChange: (date: number | undefined) => void;
    onDueDateChange: (date: number | undefined) => void;
    onRecurrenceChange: (recurrence: RecurrenceConfig | undefined) => void;
    onBlockedByChange: (ids: string[]) => void;
    isEditing: boolean;
    isOverdue: boolean;
    tagName: string;
    tagColor: string;
    isFocused?: boolean;
    timeDisplay?: string | null;
    isRunning?: boolean;
}

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
    const tasksBeingBlocked = useMemo(() => {
        if (!allTasks) return [];
        return allTasks.filter(t => t.blockedBy?.includes(task.id) && t.status !== 'completed');
    }, [allTasks, task.id]);

    const getEnergyColor = (lvl: EnergyLevel) => {
        switch(lvl) {
            case 'Low': return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
            case 'High': return { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
            case 'Medium': 
            default:
                return { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
        }
    };
    const energyStyle = getEnergyColor(effectiveEnergy);
    const dependencyCount = effectiveBlockedBy?.length || 0;

    const tagChipButtonStyle = (isEditing && effectiveTagId) ? {
        backgroundColor: `${tagColor}1A`, // ~10% opacity
        borderColor: `${tagColor}33`, // ~20% opacity
    } : undefined;

    return (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Chip 
                icon={Hash}
                label={tagName}
                isEditing={isEditing}
                isActive={!!effectiveTagId}
                
                // For text color in both modes, use inline styles
                iconColor={tagColor}
                labelColor={tagColor}

                // For bg/border in edit mode. These static classes are for the non-dynamic "Inbox" case.
                bgClass={!effectiveTagId ? 'bg-foreground/5' : undefined}
                borderClass={!effectiveTagId ? 'border-transparent' : undefined}
                colorClass={!effectiveTagId ? 'text-secondary' : undefined}

                // New prop for dynamic styling in edit mode
                buttonStyle={tagChipButtonStyle}

                flyoutContent={(close) => <TagPicker tags={tags} selectedTagId={effectiveTagId} onSelect={(id) => { onTagChange(id); close(); }} />}
            />
            {!isEditing && effectiveTagId && <span className="w-1 h-1 rounded-full bg-secondary/30"></span>}

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

            {(isEditing || effectiveDueDate) && (
                <Chip 
                    icon={Calendar}
                    label={effectiveDueDate ? new Date(effectiveDueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "Deadline"}
                    isEditing={isEditing}
                    isActive={!!effectiveDueDate}
                    colorClass={isOverdue ? "text-red-400 font-bold" : "text-secondary"}
                    bgClass="bg-red-500/10"
                    borderClass="border-red-500/20"
                    flyoutContent={(close) => <DatePicker value={effectiveDueDate} onChange={(d) => { onDueDateChange(d); close(); }} type="due" />}
                />
            )}

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

            {isFocused && !isEditing && timeDisplay ? (
                <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isRunning ? 'text-primary' : 'text-secondary'}`}>
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

            {(isEditing || dependencyCount > 0) && (
                <Chip
                    icon={GitBranch}
                    label={dependencyCount > 0 ? `${dependencyCount} blocked` : "Blocks"}
                    isEditing={isEditing}
                    isActive={dependencyCount > 0}
                    colorClass={dependencyCount > 0 ? "text-blue-400" : "text-secondary"}
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
            
            {!isEditing && tasksBeingBlocked.length > 0 && (
                <div 
                    className="flex items-center gap-1 text-[11px] text-blue-400 font-medium"
                    title={`Blocking ${tasksBeingBlocked.length} task${tasksBeingBlocked.length > 1 ? 's' : ''}: ${tasksBeingBlocked.map(t => t.title).join(', ')}`}
                >
                    <Share2 size={10} />
                    <span>Blocking {tasksBeingBlocked.length}</span>
                </div>
            )}
        </div>
    );
};

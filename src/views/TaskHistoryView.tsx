'use client';

import React from 'react';
import { ArrowLeft, Meh, Battery, BatteryWarning, Inbox } from 'lucide-react';
import { TaskEntity } from '@/entities/task';
import { useTaskContext } from '@/context/TaskContext';
import { Page } from '@/shared/layout/Page';
import { IconBadge } from '@/shared/ui/IconBadge';
import { EmptyState } from '@/shared/ui/Feedback';
import { useNavigation } from '@/context/NavigationContext';

/**
 * Interface for a task that has been finalized.
 */
interface CompletedTask extends TaskEntity {
  /** Total time spent in seconds, if captured by a focus session. */
  actualDuration?: number;
}

/**
 * Internal component for rendering a colored badge with custom styling.
 */
const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-foreground/10 text-foreground' }) => (
    <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-widest border border-border ${color}`}>
        {children}
    </span>
);

/**
 * Helper to format a Unix timestamp into human-readable date and time strings.
 */
const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const isToday = taskDate.getTime() === today.getTime();
  const isYesterday = taskDate.getTime() === today.getTime() - (24 * 60 * 60 * 1000);
  
  const dateStr = isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return { dateStr, timeStr };
};

/**
 * Internal component for rendering a single task row within the history list.
 */
const HistoryCard: React.FC<{ task: CompletedTask }> = ({ task }) => {
  const { dateStr, timeStr } = formatDateTime(task.completedAt || task.createdAt);
  const timeSpent = task.actualDuration ? `${Math.floor(task.actualDuration / 60)}m` : `${task.duration}m`;

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Work': return 'text-accent-purple bg-accent-purple/10';
          case 'Wellbeing': return 'text-primary bg-primary/10';
          default: return 'text-secondary bg-foreground/5';
      }
  };

  const MoodIcon = task.completionMood === 'Energized' ? Battery : task.completionMood === 'Drained' ? BatteryWarning : Meh;
  const moodVariant = task.completionMood === 'Energized' ? 'success' : task.completionMood === 'Drained' ? 'warning' : 'neutral';

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0 hover:bg-foreground/5 transition-colors -mx-4 px-4">
      <div className="flex items-center gap-4 min-w-0">
        <IconBadge icon={MoodIcon} variant={moodVariant} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{task.title}</div>
          <div className="text-xs text-secondary/60 truncate mt-0.5">
             {dateStr}, {timeStr} <span className="text-secondary/30 mx-1">•</span> {timeSpent}
          </div>
        </div>
      </div>
      <div className="shrink-0 ml-4">
         <Badge color={getCategoryColor(task.category)}>{task.category}</Badge>
      </div>
    </div>
  );
};

/**
 * View for inspecting completed and archived tasks.
 * Useful for reviewing past performance and biological impact logs.
 *
 * @component
 */
export const TaskHistoryView: React.FC = () => {
  const { tasks } = useTaskContext();
  const { showDatabase } = useNavigation();
  
  // Filter for completed items and sort by most recent completion time.
  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  return (
    <Page.Root>
        <Page.Header 
            title="History" 
            actions={
                <button onClick={() => showDatabase()} className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back</span>
                </button>
            }
        />

        <Page.Content>
            <div className="bg-foreground/5 rounded-3xl border border-border px-4 min-h-[200px] relative z-10">
            {completedTasks.length > 0 ? (
                completedTasks.map((task) => <HistoryCard key={task.id} task={task} />)
            ) : (
                <EmptyState 
                    icon={Inbox} 
                    title="No History" 
                    message="Completed tasks will appear here." 
                />
            )}
            </div>
        </Page.Content>
    </Page.Root>
  );
};

export default TaskHistoryView;

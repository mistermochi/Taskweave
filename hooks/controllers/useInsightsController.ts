
import { useMemo } from "react";
import { useVitalsContext } from '@/context/VitalsContext';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Category, TaskEntity } from "@/types";

export const useInsightsController = () => {
  const { vitals: recentVitals, loading: contextLoading } = useVitalsContext();

  // Fetch full completed history specifically for Insights view.
  const historyConstraints = useMemo(() => [
    where('status', '==', 'completed')
  ], []);

  const { data: allCompletedTasks, loading: historyLoading } = useFirestoreCollection<TaskEntity>('tasks', historyConstraints);

  const sortedVitals = useMemo(() => {
    return [...recentVitals].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [recentVitals]);

  const stats = useMemo(() => {
    const totalTasks = allCompletedTasks.length;
    const totalSeconds = allCompletedTasks.reduce((acc, t) => 
      acc + (t.actualDuration ? t.actualDuration : t.duration * 60), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutesRemainder = Math.floor((totalSeconds % 3600) / 60);

    const categories: Category[] = ['Work', 'Wellbeing', 'Personal', 'Hobbies'];
    const categoryStats = categories.map(cat => {
      const catTasks = allCompletedTasks.filter(t => t.category === cat);
      const count = catTasks.length;
      const seconds = catTasks.reduce((acc, t) => acc + (t.actualDuration ? t.actualDuration : t.duration * 60), 0);
      return { 
        category: cat, 
        count, 
        seconds,
        percentage: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0
      };
    }).sort((a, b) => b.seconds - a.seconds);

    const topCategory = categoryStats[0]?.seconds > 0 ? categoryStats[0] : null;

    const hourCounts = new Array(24).fill(0);
    allCompletedTasks.forEach(t => {
      const date = new Date(t.completedAt || t.createdAt);
      hourCounts[date.getHours()]++;
    });
    
    const maxTasksInHour = Math.max(...hourCounts);
    const peakHourIndex = hourCounts.indexOf(maxTasksInHour);
    
    const formatHour = (hour: number) => {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return `${h} ${ampm}`;
    };

    const peakTimeLabel = maxTasksInHour > 0 ? formatHour(peakHourIndex) : '--';

    const avgDurationSeconds = totalTasks > 0 ? totalSeconds / totalTasks : 0;
    const avgDurationMinutes = Math.round(avgDurationSeconds / 60);

    return {
      totalTasks,
      totalHours,
      totalMinutes: totalMinutesRemainder,
      categoryStats,
      topCategory,
      peakTimeLabel,
      avgDurationMinutes,
      isEmpty: totalTasks === 0
    };
  }, [allCompletedTasks]);

  return {
    state: {
      isLoading: contextLoading || historyLoading,
      ...stats,
      recentVitals: sortedVitals
    }
  };
};

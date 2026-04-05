import { useMemo } from "react";
import { useVitalsContext } from '@/context/VitalsContext';
import { useTaskContext } from '@/context/TaskContext';
import { Category } from "@/entities/tag";

/**
 * View Controller for the Insights/Analytics interface.
 * Aggregates historical task and vitals data to calculate productivity metrics,
 * category distributions, and peak focus hours.
 *
 * @returns State containing aggregated statistics and recent vitals for charting.
 */
export const useInsightsController = () => {
  const { vitals: recentVitals, loading: contextLoading } = useVitalsContext();
  const { tasks: allTasks, loading: tasksLoading } = useTaskContext();

  /**
   * Derive completed tasks from the global task context.
   * Bolt ⚡ Optimization: Reuse existing TaskContext subscription instead of creating a new one.
   */
  const allCompletedTasks = useMemo(() => allTasks.filter(t => t.status === 'completed'), [allTasks]);

  /**
   * Most recent 50 vitals.
   * Bolt ⚡ Optimization: Remove redundant sort as VitalsContext already provides data sorted desc
   */
  const sortedVitals = useMemo(() => {
    return recentVitals.slice(0, 50);
  }, [recentVitals]);

  /**
   * Aggregated performance metrics calculated from the user's full history.
   * Includes:
   * - Total tasks completed and total hours focused.
   * - Breakdowns by category (e.g., Work vs Personal).
   * - Identification of the user's "Peak Focus Hour".
   * - Average task duration.
   */
  const stats = useMemo(() => {
    const totalTasks = allCompletedTasks.length;
    const hourCounts = new Array(24).fill(0);
    const categories: Category[] = ['Work', 'Wellbeing', 'Personal', 'Hobbies'];

    // Bolt ⚡ Optimization: Aggregate all metrics in a single pass $O(N)$
    // instead of multiple filter/reduce/map passes (~10 traversals).
    let totalSeconds = 0;
    const categoryMetrics: Record<string, { count: number; seconds: number }> = {
      'Work': { count: 0, seconds: 0 },
      'Wellbeing': { count: 0, seconds: 0 },
      'Personal': { count: 0, seconds: 0 },
      'Hobbies': { count: 0, seconds: 0 }
    };

    // Heatmap data initialization (last 30 days)
    const now = new Date();
    const getDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const heatmap = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d);
      heatmap.push({
        date: dateKey,
        slots: new Array(6).fill(0) // 0-4, 4-8, 8-12, 12-16, 16-20, 20-24
      });
    }
    const dateToHeatmapIndex = new Map(heatmap.map((item, index) => [item.date, index]));

    allCompletedTasks.forEach(t => {
      const seconds = (t.actualDuration ? t.actualDuration : t.duration * 60);
      totalSeconds += seconds;

      if (categoryMetrics[t.category]) {
        categoryMetrics[t.category].count++;
        categoryMetrics[t.category].seconds += seconds;
      }

      const compAt = t.completedAt || t.createdAt;
      const date = new Date(compAt);
      hourCounts[date.getHours()]++;

      // Heatmap logic: use local time as requested
      const dateKey = getDateKey(date);
      if (dateToHeatmapIndex.has(dateKey)) {
        const dayIndex = dateToHeatmapIndex.get(dateKey)!;
        const hour = date.getHours();
        const slotIndex = Math.floor(hour / 4);
        const heatmapSeconds = t.actualDuration || 900; // 15m fallback
        heatmap[dayIndex].slots[slotIndex] += heatmapSeconds;
      }
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutesRemainder = Math.floor((totalSeconds % 3600) / 60);

    const categoryStats = categories.map(cat => {
      const metrics = categoryMetrics[cat];
      return { 
        category: cat, 
        count: metrics.count,
        seconds: metrics.seconds,
        percentage: totalSeconds > 0 ? (metrics.seconds / totalSeconds) * 100 : 0
      };
    }).sort((a, b) => b.seconds - a.seconds);

    const topCategory = categoryStats[0]?.seconds > 0 ? categoryStats[0] : null;

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
      isEmpty: totalTasks === 0,
      heatmapData: heatmap
    };
  }, [allCompletedTasks]);

  return {
    state: {
      isLoading: contextLoading || tasksLoading,
      ...stats,
      recentVitals: sortedVitals
    }
  };
};

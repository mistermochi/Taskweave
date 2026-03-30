'use client';

import React, { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { ViewName } from '@/types';
import { Category } from '@/entities/tag';
import { UserVital } from '@/entities/vital';
import { Zap, Clock, Target, Activity, Layers, Wind, Smile, AlignLeft, MapPin, Battery, Wifi, X, BatteryWarning, BarChart3 } from 'lucide-react';
import { useInsightsController } from '@/hooks/controllers/useInsightsController';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/ui/drawer';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Avatar, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Badge } from '@/shared/ui/ui/badge';
import { ScrollArea } from '@/shared/ui/ui/scroll-area';
import { AppHeader } from '@/shared/ui/ui/app-header';
import { TaskNavigation } from '@/features/task-app/components/task-navigation';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';


/**
 * Internal component for rendering a single entry in the Vital Log list.
 * It dynamically chooses an icon and color based on the vital type and metadata.
 */
const VitalLogItem: React.FC<{ vital: UserVital, onClick: (v: UserVital) => void }> = ({ vital, onClick }) => {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
        return isToday ? 'Today' : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    let Icon = Activity;
    let colorClass = 'text-zinc-500';
    let bgClass = 'bg-zinc-100 dark:bg-zinc-800';
    let content = '';
    let label = '';
    let variant: "default" | "secondary" | "outline" | "destructive" = "secondary";

    switch (vital.type) {
        case 'mood':
            const val = Number(vital.value);
            const source = vital.metadata?.source;
            const isEnergyScale = val > 5;

            if (source === 'passive_drain') {
                Icon = BatteryWarning;
                colorClass = 'text-orange-500';
                bgClass = 'bg-orange-50 dark:bg-orange-900/20';
                content = `Energy dropped to ${val}% (Passive Drain)`;
                label = 'Energy Drain';
                variant = "destructive";
            } else if (source === 'session_completion') {
                Icon = Zap;
                const mood = vital.metadata?.mood || 'Completed';
                colorClass = 'text-blue-500';
                bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                content = `Session: ${mood} → ${val}% Energy`;
                label = 'Session Log';
                variant = "default";
            } else if (isEnergyScale) {
                Icon = Zap;
                colorClass = 'text-yellow-600 dark:text-yellow-400';
                bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
                content = `Energy Level: ${val}%`;
                label = 'Energy Update';
            } else {
                Icon = Smile;
                colorClass = 'text-yellow-600 dark:text-yellow-400';
                bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
                const moodMap = ['Unknown', 'Drained', 'Low', 'Neutral', 'Good', 'Great'];
                content = moodMap[val as number] || 'Neutral';
                label = 'Mood Check-in';
            }
            break;
        case 'focus':
            Icon = Target;
            colorClass = 'text-blue-500';
            bgClass = 'bg-blue-50 dark:bg-blue-900/20';
            content = String(vital.value);
            label = 'Intention Set';
            variant = "outline";
            break;
        case 'journal':
            Icon = AlignLeft;
            colorClass = 'text-purple-500';
            bgClass = 'bg-purple-50 dark:bg-purple-900/20';
            content = String(vital.value);
            label = 'Journal Entry';
            variant = "outline";
            break;
        case 'breathe':
            Icon = Wind;
            colorClass = 'text-cyan-500';
            bgClass = 'bg-cyan-50 dark:bg-cyan-900/20';
            const duration = Number(vital.value);
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            content = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            label = 'Breathing Session';
            variant = "outline";
            break;
    }

    return (
        <div
          onClick={() => onClick(vital)}
          className="flex gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors px-4"
        >
            <Avatar className={cn("h-9 w-9 border", bgClass)}>
                <AvatarFallback className={cn("bg-transparent", colorClass)}>
                    <Icon size={18} />
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <Badge variant={variant} className="text-[9px] uppercase tracking-wider px-1.5 h-4 font-bold leading-none">
                        {label}
                    </Badge>
                    <span className="text-[10px] text-zinc-500 tabular-nums font-medium">
                        {formatDate(vital.timestamp)} • {formatTime(vital.timestamp)}
                    </span>
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate font-medium">{content}</p>
            </div>
            {vital.context && <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></div>}
        </div>
    );
};

/**
 * Modal that displays the environmental snapshot (location, battery, network)
 * captured at the moment a vital log was created.
 */
const VitalContextModal = ({ vital, onClose }: { vital: UserVital | null, onClose: () => void }) => {
  const isMobile = useIsMobile();
  if (!vital || !vital.context) return null;
  const ctx = vital.context;

  const content = (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-zinc-950 rounded-md text-zinc-500 border border-zinc-100 dark:border-zinc-800">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">Location</div>
            <div className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">{ctx.location.label}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Battery size={16} className={ctx.device.batteryLevel && ctx.device.batteryLevel < 0.2 ? 'text-red-500' : 'text-blue-500'} />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Battery</span>
          </div>
          <div className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tabular-nums">
            {ctx.device.batteryLevel ? Math.round(ctx.device.batteryLevel * 100) : '--'}%
            {ctx.device.isCharging && <span className="text-xs ml-1 text-blue-500">⚡</span>}
          </div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={16} className="text-blue-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Network</span>
          </div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize truncate">
            {ctx.device.networkType || 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
        <span>{new Date(vital.timestamp).toLocaleString()}</span>
        <span>{ctx.activity.motionIntensity}</span>
      </div>

      {vital.metadata?.drainAmount && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
          Passive Drain: -{vital.metadata.drainAmount} energy over {Number(vital.metadata.hoursSinceLast).toFixed(1)}h
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={!!vital} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Snapshot Context</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!vital} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Snapshot Context</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Analytics dashboard displaying productivity and wellness trends.
 * Includes visual orbits for task distribution, high-level metrics (Peak Flow, Top Focus),
 * and a deep vital event log for inspecting context.
 *
 * @component
 */
export const InsightsView: React.FC = () => {
  const { state } = useInsightsController();
  const [selectedVital, setSelectedVital] = useState<UserVital | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const { tasks } = useTaskContext();
  const { tags } = useReferenceContext();

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case 'Work': return '#9333ea';
      case 'Wellbeing': return '#16a34a';
      case 'Personal': return '#ea580c';
      case 'Hobbies': return '#0284c7';
      default: return 'hsl(var(--secondary))';
    }
  };

  if (state.isLoading) {
    return <div className="h-full flex items-center justify-center text-secondary bg-background">Loading insights...</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <AppHeader
        title="Insights"
        subtitle="Patterns & Progress"
        nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-9 w-9 rounded-md border border-border bg-muted/50 flex items-center justify-center shrink-0">
              <Activity size={18} className="text-primary" />
            </div>
          </div>
        }
      />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b">
            <TabsList className="h-8 p-0.5 bg-zinc-100 dark:bg-zinc-800">
              <TabsTrigger value="overview" className="text-xs px-4 h-7">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs px-4 h-7">Activity Log</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs px-4 h-7">Trends</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
            <TabsContent value="overview" className="m-0 pt-4 space-y-6">
         {/* 1. Main Focus Orbit */}
         <section className="flex items-center justify-center py-6 min-h-[300px]">
            <div className="relative w-64 h-64 flex items-center justify-center">
                {state.categoryStats.map((stat, index) => (
                    <div
                        key={stat.category}
                        className="absolute inset-0 rounded-full border-2 transition-all duration-1000 ease-out"
                        style={{
                            borderColor: getCategoryColor(stat.category),
                            opacity: stat.percentage > 0 ? 0.3 : 0.1,
                            transform: `scale(${1 - (index * 0.12)})`,
                            borderStyle: index % 2 === 0 ? 'solid' : 'dashed'
                        }}
                    ></div>
                ))}

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[4rem] font-light text-foreground leading-none tracking-tighter">
                        {state.totalHours}<span className="text-xl text-muted-foreground font-light">h</span>
                    </span>
                    <span className="text-lg font-light text-foreground/80 -mt-1">
                        {state.totalMinutes}<span className="text-xs text-muted-foreground ml-0.5">m</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Total Focus</span>
                </div>
            </div>
         </section>

         {/* 2. Grid Metrics */}
         <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Peak Flow</CardTitle>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Zap size={14} className="text-blue-500" />
                  </div>
               </CardHeader>
               <CardContent className="px-4 pb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{state.peakTimeLabel}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Most productive period</p>
               </CardContent>
            </Card>

            <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Top Focus</CardTitle>
                  <div className="p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-md">
                    <Target size={14} style={{ color: state.topCategory ? getCategoryColor(state.topCategory.category) : 'gray' }} />
                  </div>
               </CardHeader>
               <CardContent className="px-4 pb-4">
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 block truncate tracking-tight">
                      {state.topCategory ? state.topCategory.category : 'N/A'}
                  </span>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                            width: `${state.topCategory ? state.topCategory.percentage : 0}%`,
                            backgroundColor: state.topCategory ? getCategoryColor(state.topCategory.category) : 'gray'
                        }}
                      ></div>
                  </div>
               </CardContent>
            </Card>

            <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Completed</CardTitle>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Layers size={14} className="text-blue-500" />
                  </div>
               </CardHeader>
               <CardContent className="px-4 pb-4">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{state.totalTasks}</span>
                  <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Tasks finalized</p>
               </CardContent>
            </Card>

            <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Avg Session</CardTitle>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Clock size={14} className="text-blue-500" />
                  </div>
               </CardHeader>
               <CardContent className="px-4 pb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{state.avgDurationMinutes}</span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">min</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Deep work session</p>
               </CardContent>
            </Card>
         </section>

            </TabsContent>

            <TabsContent value="activity" className="m-0 pt-4">
               {/* 3. Vital Event Log */}
               <section>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">Full Vital Log</h2>
                  <Card className="shadow-none border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <CardContent className="p-0">
                          <ScrollArea className="h-[600px]">
                              {state.recentVitals.length > 0 ? (
                                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                      {state.recentVitals.map((vital) => (
                                          <VitalLogItem
                                            key={vital.id}
                                            vital={vital}
                                            onClick={(v) => { if (v.context) setSelectedVital(v); }}
                                          />
                                      ))}
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center justify-center h-[200px] text-zinc-400">
                                      <Activity size={24} className="mb-2 opacity-50" />
                                      <p className="text-sm font-medium">No vital events recorded yet.</p>
                                  </div>
                              )}
                          </ScrollArea>
                      </CardContent>
                  </Card>
               </section>
            </TabsContent>

            <TabsContent value="trends" className="m-0">
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <BarChart3 size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">Trend visualizations coming soon.</p>
                </div>
            </TabsContent>
          </div>
        </Tabs>

       {/* Context Modal */}
       {selectedVital && (
         <VitalContextModal vital={selectedVital} onClose={() => setSelectedVital(null)} />
       )}
      </div>
    </div>
  );
};

export default InsightsView;

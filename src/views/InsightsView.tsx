'use client';

import React, { useState } from 'react';
import { ViewName, NavigationHandler } from '@/types';
import { Category } from '@/entities/tag';
import { UserVital } from '@/entities/vital';
import { Zap, Clock, Target, Activity, Layers, Wind, Smile, AlignLeft, MapPin, Battery, Wifi, X, BatteryWarning } from 'lucide-react';
import { useInsightsController } from '@/hooks/controllers/useInsightsController';
import { Page } from '@/shared/layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';

/**
 * Interface for InsightsView props.
 */
interface InsightsViewProps {
  /** Callback for handling navigation to other views. */
  onNavigate: NavigationHandler;
}

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
    let colorClass = 'text-secondary';
    let bgClass = 'bg-foreground/5';
    let content = '';
    let label = '';

    switch (vital.type) {
        case 'mood':
            const val = Number(vital.value);
            const source = vital.metadata?.source;
            const isEnergyScale = val > 5;

            if (source === 'passive_drain') {
                Icon = BatteryWarning;
                colorClass = 'text-orange-400';
                bgClass = 'bg-orange-400/10';
                content = `Energy dropped to ${val}% (Passive Drain)`;
                label = 'Energy Drain';
            } else if (source === 'session_completion') {
                Icon = Zap;
                const mood = vital.metadata?.mood || 'Completed';
                colorClass = 'text-primary';
                bgClass = 'bg-primary/10';
                content = `Session: ${mood} → ${val}% Energy`;
                label = 'Session Log';
            } else if (isEnergyScale) {
                Icon = Zap;
                colorClass = 'text-yellow-400';
                bgClass = 'bg-yellow-400/10';
                content = `Energy Level: ${val}%`;
                label = 'Energy Update';
            } else {
                Icon = Smile;
                colorClass = 'text-yellow-400';
                bgClass = 'bg-yellow-400/10';
                const moodMap = ['Unknown', 'Drained', 'Low', 'Neutral', 'Good', 'Great'];
                content = moodMap[val as number] || 'Neutral';
                label = 'Mood Check-in';
            }
            break;
        case 'focus':
            Icon = Target;
            colorClass = 'text-primary';
            bgClass = 'bg-primary/10';
            content = String(vital.value);
            label = 'Intention Set';
            break;
        case 'journal':
            Icon = AlignLeft;
            colorClass = 'text-purple-400';
            bgClass = 'bg-purple-400/10';
            content = String(vital.value);
            label = 'Journal Entry';
            break;
        case 'breathe':
            Icon = Wind;
            colorClass = 'text-blue-400';
            bgClass = 'bg-blue-400/10';
            const duration = Number(vital.value);
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            content = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            label = 'Breathing Session';
            break;
    }

    return (
        <div 
          onClick={() => onClick(vital)}
          className="flex gap-4 py-3 border-b border-border last:border-0 items-center cursor-pointer hover:bg-accent/50 transition-colors px-4"
        >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        {formatDate(vital.timestamp)} • {formatTime(vital.timestamp)}
                    </span>
                </div>
                <p className="text-sm text-foreground truncate font-medium">{content}</p>
            </div>
            {vital.context && <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>}
        </div>
    );
};

/**
 * Modal that displays the environmental snapshot (location, battery, network)
 * captured at the moment a vital log was created.
 */
const VitalContextModal = ({ vital, onClose }: { vital: UserVital | null, onClose: () => void }) => {
  if (!vital || !vital.context) return null;
  const ctx = vital.context;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={onClose}>
      <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
             <CardTitle className="text-xs font-bold uppercase tracking-widest">Snapshot Context</CardTitle>
             <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent"><X size={16} /></button>
         </CardHeader>

         <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-sm border border-border">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-background rounded-sm text-muted-foreground border border-border"><MapPin size={16} /></div>
                   <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</div>
                      <div className="text-sm text-foreground font-medium">{ctx.location.label}</div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-muted/50 rounded-sm border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Battery size={16} className={ctx.device.batteryLevel && ctx.device.batteryLevel < 0.2 ? 'text-destructive' : 'text-primary'} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Battery</span>
                    </div>
                    <div className="text-xl font-light text-foreground tabular-nums">
                        {ctx.device.batteryLevel ? Math.round(ctx.device.batteryLevel * 100) : '--'}%
                        {ctx.device.isCharging && <span className="text-xs ml-1 text-primary">⚡</span>}
                    </div>
                 </div>
                 <div className="p-3 bg-muted/50 rounded-sm border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Wifi size={16} className="text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net</span>
                    </div>
                    <div className="text-lg font-light text-foreground capitalize truncate">
                        {ctx.device.networkType || 'Offline'}
                    </div>
                 </div>
             </div>

             <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-muted-foreground font-medium">
                <span>{new Date(vital.timestamp).toLocaleString()}</span>
                <span>{ctx.activity.motionIntensity}</span>
             </div>
             
             {vital.metadata?.drainAmount && (
                 <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-xs text-destructive">
                     Passive Drain: -{vital.metadata.drainAmount} energy over {Number(vital.metadata.hoursSinceLast).toFixed(1)}h
                 </div>
             )}
         </CardContent>
      </Card>
    </div>
  );
};

/**
 * Analytics dashboard displaying productivity and wellness trends.
 * Includes visual orbits for task distribution, high-level metrics (Peak Flow, Top Focus),
 * and a deep vital event log for inspecting context.
 *
 * @component
 */
export const InsightsView: React.FC<InsightsViewProps> = ({ onNavigate }) => {
  const { state } = useInsightsController();
  const [selectedVital, setSelectedVital] = useState<UserVital | null>(null);

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
    <Page.Root>
       <Page.Header 
          title="Insights"
          subtitle="Patterns & Progress"
          actions={
            <div className="h-10 w-10 rounded-sm border border-border bg-muted/50 flex items-center justify-center">
                <Activity size={18} className="text-primary" />
            </div>
          }
       />

       <Page.Content>
         
         {/* 1. Main Focus Orbit */}
         <Page.Section className="flex items-center justify-center py-6 min-h-[300px]">
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
         </Page.Section>

         {/* 2. Grid Metrics */}
         <Page.Section className="grid grid-cols-2 gap-3">
            <Card className="rounded-sm shadow-none">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Peak Flow</CardTitle>
                  <Zap size={14} className="text-primary" />
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <span className="text-2xl font-light text-foreground">{state.peakTimeLabel}</span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">Most productive time</p>
               </CardContent>
            </Card>

            <Card className="rounded-sm shadow-none">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top Focus</CardTitle>
                  <Target size={14} style={{ color: state.topCategory ? getCategoryColor(state.topCategory.category) : 'hsl(var(--primary))' }} />
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <span className="text-xl font-medium text-foreground block truncate">
                      {state.topCategory ? state.topCategory.category : 'N/A'}
                  </span>
                  <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full"
                        style={{ 
                            width: `${state.topCategory ? state.topCategory.percentage : 0}%`,
                            backgroundColor: state.topCategory ? getCategoryColor(state.topCategory.category) : 'gray' 
                        }}
                      ></div>
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-sm shadow-none">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completed</CardTitle>
                  <Layers size={14} className="text-primary" />
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <span className="text-2xl font-light text-foreground">{state.totalTasks}</span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">Tasks completed</p>
               </CardContent>
            </Card>

            <Card className="rounded-sm shadow-none">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Session</CardTitle>
                  <Clock size={14} className="text-primary" />
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <span className="text-2xl font-light text-foreground">{state.avgDurationMinutes}<span className="text-sm text-muted-foreground ml-1">m</span></span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">Deep work depth</p>
               </CardContent>
            </Card>
         </Page.Section>
         
         {/* 3. Vital Event Log */}
         <Page.Section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Vital Log</h2>
            <Card className="rounded-sm shadow-none overflow-hidden">
                <CardContent className="p-0">
                    {state.recentVitals.length > 0 ? (
                        <div className="divide-y divide-border">
                            {state.recentVitals.map((vital) => (
                                <VitalLogItem
                                  key={vital.id}
                                  vital={vital}
                                  onClick={(v) => { if (v.context) setSelectedVital(v); }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-xs">No vital events recorded yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
         </Page.Section>

       </Page.Content>

       {/* Context Modal */}
       {selectedVital && (
         <VitalContextModal vital={selectedVital} onClose={() => setSelectedVital(null)} />
       )}
    </Page.Root>
  );
};

export default InsightsView;

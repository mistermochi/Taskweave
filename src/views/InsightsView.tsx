'use client';

import React, { useState } from 'react';
import { ViewName, NavigationHandler } from '@/types';
import { Category } from '@/entities/tag';
import { UserVital } from '@/entities/vital';
import { Zap, Clock, Target, Activity, Layers, Wind, Smile, AlignLeft, MapPin, Battery, Wifi, X, BatteryWarning } from 'lucide-react';
import { useInsightsController } from '@/hooks/controllers/useInsightsController';
import { Page } from '@/shared/layout/Page';

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
          className="flex gap-4 py-3 border-b border-border last:border-0 items-center animate-fade-in cursor-pointer hover:bg-foreground/5 transition-colors -mx-4 px-4 rounded-lg"
        >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xxs font-bold uppercase tracking-wider text-secondary/60">{label}</span>
                    <span className="text-xxs text-secondary/40 tabular-nums">
                        {formatDate(vital.timestamp)} • {formatTime(vital.timestamp)}
                    </span>
                </div>
                <p className="text-sm text-foreground/90 truncate font-medium">{content}</p>
            </div>
            {vital.context && <div className="w-1.5 h-1.5 rounded-full bg-secondary/30"></div>}
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
      <div className="bg-surface rounded-2xl border border-border w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in" onClick={e => e.stopPropagation()}>
         
         <div className="flex items-center justify-between p-4 border-b border-border">
             <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Snapshot Context</h3>
             <button onClick={onClose} className="text-secondary hover:text-foreground p-1 rounded-full hover:bg-foreground/10"><X size={16} /></button>
         </div>

         <div className="p-4 space-y-4">
             <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-foreground/5 rounded-full text-secondary"><MapPin size={16} /></div>
                   <div>
                      <div className="text-xxs font-bold text-secondary uppercase tracking-wider">Location</div>
                      <div className="text-sm text-foreground font-medium">{ctx.location.label}</div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-foreground/5 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Battery size={16} className={ctx.device.batteryLevel && ctx.device.batteryLevel < 0.2 ? 'text-red-400' : 'text-green-400'} />
                        <span className="text-xxs font-bold text-secondary uppercase tracking-wider">Battery</span>
                    </div>
                    <div className="text-xl font-light text-foreground tabular-nums">
                        {ctx.device.batteryLevel ? Math.round(ctx.device.batteryLevel * 100) : '--'}%
                        {ctx.device.isCharging && <span className="text-xs ml-1 text-yellow-400">⚡</span>}
                    </div>
                 </div>
                 <div className="p-3 bg-foreground/5 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Wifi size={16} className="text-blue-400" />
                        <span className="text-xxs font-bold text-secondary uppercase tracking-wider">Net</span>
                    </div>
                    <div className="text-lg font-light text-foreground capitalize truncate">
                        {ctx.device.networkType || 'Offline'}
                    </div>
                 </div>
             </div>

             <div className="flex justify-between items-center px-2 pt-2 text-xs text-secondary/50 font-medium">
                <span>{new Date(vital.timestamp).toLocaleString()}</span>
                <span>{ctx.activity.motionIntensity}</span>
             </div>
             
             {vital.metadata?.drainAmount && (
                 <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300">
                     Passive Drain: -{vital.metadata.drainAmount} energy over {Number(vital.metadata.hoursSinceLast).toFixed(1)}h
                 </div>
             )}
         </div>
      </div>
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
       {/* Background Ambient */}
       <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_hsl(var(--accent-purple))_0%,_transparent_50%)] opacity-5 pointer-events-none"></div>

       <Page.Header 
          title="Your Progress" 
          subtitle="Insights & Patterns"
          actions={
            <div className="h-10 w-10 rounded-full border border-border bg-foreground/5 flex items-center justify-center">
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
                            opacity: stat.percentage > 0 ? 0.2 + (stat.percentage / 200) : 0.05,
                            transform: `scale(${1 - (index * 0.12)}) rotate(${index * 45}deg)`,
                            borderStyle: index % 2 === 0 ? 'solid' : 'dashed'
                        }}
                    ></div>
                ))}
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[4rem] font-extralight text-foreground leading-none tracking-tighter">
                        {state.totalHours}<span className="text-xl text-secondary/50 font-light">h</span>
                    </span>
                    <span className="text-lg font-light text-foreground/80 -mt-1">
                        {state.totalMinutes}<span className="text-xs text-secondary/50 ml-0.5">m</span>
                    </span>
                    <span className="text-xxs font-bold uppercase tracking-[0.2em] text-secondary mt-2">Total Focus</span>
                </div>

                <div className="absolute inset-0 bg-primary/5 blur-[60px] rounded-full"></div>
            </div>
         </Page.Section>

         {/* 2. Grid Metrics */}
         <Page.Section className="grid grid-cols-2 gap-3">
            <div className="bg-foreground/5 border border-border rounded-2xl p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-xxs font-bold uppercase tracking-widest text-secondary/60">Peak Flow</span>
                  <Zap size={14} className="text-accent" />
               </div>
               <div>
                  <span className="text-2xl font-light text-foreground block">{state.peakTimeLabel}</span>
                  <p className="text-xxs text-secondary/50 leading-tight mt-1">Most productive time</p>
               </div>
            </div>

            <div className="bg-foreground/5 border border-border rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 bg-gradient-to-br from-foreground/5 to-transparent rounded-bl-full pointer-events-none"></div>
               <div className="flex items-start justify-between relative z-10">
                  <span className="text-xxs font-bold uppercase tracking-widest text-secondary/60">Top Focus</span>
                  <Target size={14} style={{ color: state.topCategory ? getCategoryColor(state.topCategory.category) : 'hsl(var(--foreground))' }} />
               </div>
               <div className="relative z-10">
                  <span className="text-xl font-medium text-foreground block truncate">
                      {state.topCategory ? state.topCategory.category : 'N/A'}
                  </span>
                  <div className="w-full bg-foreground/10 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                            width: `${state.topCategory ? state.topCategory.percentage : 0}%`,
                            backgroundColor: state.topCategory ? getCategoryColor(state.topCategory.category) : 'gray' 
                        }}
                      ></div>
                  </div>
               </div>
            </div>

            <div className="bg-foreground/5 border border-border rounded-2xl p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-xxs font-bold uppercase tracking-widest text-secondary/60">Completed</span>
                  <Layers size={14} className="text-primary" />
               </div>
               <div>
                  <span className="text-2xl font-light text-foreground block">{state.totalTasks}</span>
                  <p className="text-xxs text-secondary/50 leading-tight mt-1">Tasks completed</p>
               </div>
            </div>

            <div className="bg-foreground/5 border border-border rounded-2xl p-4 flex flex-col justify-between h-28">
               <div className="flex items-start justify-between">
                  <span className="text-xxs font-bold uppercase tracking-widest text-secondary/60">Avg Session</span>
                  <Clock size={14} className="text-blue-400" />
               </div>
               <div>
                  <span className="text-2xl font-light text-foreground block">{state.avgDurationMinutes}<span className="text-sm text-secondary ml-1">m</span></span>
                  <p className="text-xxs text-secondary/50 leading-tight mt-1">Deep work depth</p>
               </div>
            </div>
         </Page.Section>
         
         {/* 3. Vital Event Log */}
         <Page.Section>
            <h2 className="text-xxs font-bold uppercase tracking-widest text-secondary/60 mb-4 px-1">Taskweave Log</h2>
            <div className="bg-surface-highlight/20 rounded-3xl border border-border px-4 min-h-[100px] relative z-10">
                {state.recentVitals.length > 0 ? (
                    <div>
                        {state.recentVitals.map((vital) => (
                            <VitalLogItem 
                              key={vital.id} 
                              vital={vital} 
                              onClick={(v) => { if (v.context) setSelectedVital(v); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-secondary/40">
                        <Activity size={24} className="mb-2 opacity-50" />
                        <p className="text-xs">No vital events recorded yet.</p>
                    </div>
                )}
            </div>
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

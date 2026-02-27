'use client';

import React from 'react';
import { Play, Pause, Check, ChevronUp } from 'lucide-react';
import { useFocusSessionController } from '@/hooks/controllers/useFocusSessionController';
import { useNavigation } from '@/context/NavigationContext';

/**
 * The "Now Playing" mini-interface for an active task.
 * It remains visible at the bottom of the screen while a focus session is running,
 * providing immediate access to the timer and completion controls.
 *
 * @component
 * @interaction
 * - Clicking the task title or play/pause button toggles the timer.
 * - Clicking the check icon completes the task.
 * - Clicking the expand icon opens the full-screen focus view.
 */
export const FocusPlayer: React.FC = () => {
  const { activeTaskId, toggleFocusExpansion } = useNavigation();
  const { state, actions } = useFocusSessionController(activeTaskId);

  if (!state.task) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Left Side: Info & Play/Pause */}
        <div className="flex items-center gap-4 flex-1 min-w-0 group cursor-pointer" onClick={toggleFocusExpansion}>
            <button 
                onClick={(e) => { e.stopPropagation(); actions.toggleTimer(); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${state.isActive ? 'bg-primary text-background' : 'bg-foreground/10 text-foreground hover:bg-foreground/20'}`}
            >
                {state.isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
          
            <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm font-medium text-foreground truncate group-hover:text-primary">{state.task.title}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-medium ${state.isActive ? 'text-primary' : 'text-secondary'}`}>
                        {state.formattedTime}
                    </span>
                    <div className="h-1 flex-1 bg-foreground/10 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${Math.min(100, Math.max(0, (1 - (state.timeLeft / (state.task.duration * 60))) * 100))}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); actions.completeSession(); }}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all"
                title="Complete"
            >
                <Check size={18} />
            </button>
            <button 
                onClick={toggleFocusExpansion}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-secondary hover:text-foreground hover:bg-foreground/10 transition-all"
                title="Expand"
            >
                <ChevronUp size={18} />
            </button>
        </div>
    </div>
  );
};

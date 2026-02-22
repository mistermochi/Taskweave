
'use client';

import React from 'react';
import { Play, Pause, Check, ChevronDown, Wind, MoreHorizontal, ChevronUp } from 'lucide-react';
import { useFocusSessionController } from '@/hooks/controllers/useFocusSessionController';
import { useNavigation } from '@/context/NavigationContext';

export const FocusPlayer: React.FC = () => {
  const { activeTaskId, isFocusExpanded, toggleFocusExpansion } = useNavigation();
  const { state, actions } = useFocusSessionController(activeTaskId);

  if (!state.task) return null;

  // --- EXPANDED (FOCUS MODE) - Renders as a full-screen overlay ---
  if (isFocusExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <header className="px-6 py-6 flex items-center justify-between shrink-0">
              <button 
                  onClick={actions.stopCurrentSession}
                  className="p-2 -ml-2 text-secondary hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              >
                  <ChevronDown size={24} />
              </button>
              <div className="text-xxs font-bold uppercase tracking-widest text-secondary/50">
                  Focus Mode
              </div>
              <button className="p-2 -mr-2 text-secondary hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors">
                  <MoreHorizontal size={24} />
              </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-8 pt-4 pb-8">
              
              {/* Timer (Top Right/Center Hybrid) */}
              <div className="flex justify-start mb-8">
                  <div 
                      onClick={actions.toggleTimer}
                      className={`text-6xl md:text-8xl font-medium tracking-tighter tabular-nums cursor-pointer transition-colors select-none ${state.isActive ? 'text-foreground' : 'text-foreground/30'}`}
                  >
                      {state.formattedTime}
                  </div>
              </div>

              {/* Task Title */}
              <h1 className="text-3xl md:text-4xl font-medium text-foreground leading-tight mb-6">
                  {state.task.title}
              </h1>

              {/* Notes Area */}
              <div className="flex-1 bg-foreground/5 rounded-2xl p-6 border border-border hover:border-foreground/10 transition-colors group">
                  <textarea 
                      className="w-full h-full bg-transparent border-none p-0 text-base text-foreground/80 placeholder:text-secondary/30 focus:ring-0 resize-none leading-relaxed"
                      placeholder="Add session notes here..."
                      defaultValue={state.task.notes}
                      // In a real app, this would debounce save to task.notes
                  />
              </div>

          </main>

          {/* Bottom Controls */}
          <footer className="px-8 py-8 shrink-0">
              <div className="max-w-md mx-auto flex items-center justify-between gap-8">
                  
                  {/* Break */}
                  <button 
                      onClick={actions.handleBreathing}
                      className="flex flex-col items-center gap-2 text-secondary hover:text-blue-400 transition-colors group"
                  >
                      <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all">
                          <Wind size={20} />
                      </div>
                      <span className="text-xxs font-bold uppercase tracking-wider">Break</span>
                  </button>

                  {/* Main Play/Pause */}
                  <button 
                      onClick={actions.toggleTimer}
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl ${state.isActive ? 'bg-foreground text-background hover:scale-105' : 'bg-primary text-background hover:bg-primary-dim hover:scale-105'}`}
                  >
                      {state.isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </button>

                  {/* Finish */}
                  <button 
                      onClick={actions.completeSession}
                      className="flex flex-col items-center gap-2 text-secondary hover:text-primary transition-colors group"
                  >
                      <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                          <Check size={24} />
                      </div>
                      <span className="text-xxs font-bold uppercase tracking-wider">Finish</span>
                  </button>

              </div>
          </footer>
      </div>
    );
  }

  // --- MINIMIZED (PLAYER BAR) - Renders as part of the main layout flow ---
  return (
    <div className="w-full shrink-0 bg-surface/95 backdrop-blur-xl border-t border-border flex items-center p-2 px-4 gap-4 z-50">
        
        {/* Left Side: Play/Pause and Info */}
        <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
            onClick={toggleFocusExpansion}
        >
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

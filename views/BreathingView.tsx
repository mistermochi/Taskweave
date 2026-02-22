
'use client';

import React from 'react';
import { X, Wind } from 'lucide-react';
import { useBreathingController } from '../hooks/controllers/useBreathingController';

export const BreathingView: React.FC = () => {
  const { state, actions } = useBreathingController();
  const { phase, text } = state;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in-0 duration-500">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-radial-gradient from-primary to-background opacity-20 pointer-events-none"></div>

      {/* Close Button */}
      <button 
          onClick={actions.closeSession}
          className="absolute top-8 right-6 z-30 p-2 text-foreground/30 hover:text-foreground hover:bg-foreground/10 rounded-full transition-all"
      >
          <X size={24} />
      </button>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        
        {/* Breathing Animation Container */}
        <div className="relative flex items-center justify-center w-96 h-96">
           
           {/* Glow Layer */}
           <div 
             className="absolute w-full h-full rounded-full bg-primary/20 blur-[80px] animate-breathe"
             style={{ animationDelay: '0.2s' }}
           ></div>

           {/* Outer Ring */}
           <div 
             className="absolute w-80 h-80 border border-primary/20 rounded-full animate-breathe"
           ></div>

           {/* Middle Ring */}
           <div 
             className="absolute w-64 h-64 border border-primary/40 rounded-full animate-breathe"
             style={{ animationDelay: '0.1s' }}
           ></div>

           {/* Core Orb */}
           <div 
             className="relative flex items-center justify-center rounded-full bg-background w-48 h-48 shadow-[0_0_60px_hsla(var(--primary),0.4)] animate-breathe"
             style={{ animationDelay: '0.15s' }}
           >
             <span className={`text-lg font-bold uppercase tracking-[0.25em] text-primary-dim transition-all duration-500 ${phase === 'exhale' ? 'opacity-50' : 'opacity-100'}`}>
                {text}
             </span>
           </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-2 text-center animate-in fade-in duration-1000 delay-500">
           <div className="flex items-center gap-2 text-primary/60 mb-2">
             <Wind size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Resonance Breathing</span>
           </div>
           <p className="text-secondary/50 text-sm max-w-xs leading-relaxed">
              Sync your breath with the light to calm your nervous system.
           </p>
        </div>

      </main>
    </div>
  );
};

export default BreathingView;

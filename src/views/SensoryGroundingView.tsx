'use client';

import React, { useState } from 'react';
import { X, Eye, Hand, Ear, Wind, Smile, Check } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';

/**
 * Guided grounding exercise following the "5-4-3-2-1" technique.
 * It helps users reduce anxiety and regain focus during high-stress moments
 * by forcing them to interact with their immediate environment using all five senses.
 *
 * @component
 * @interaction
 * - Users tap the screen to "find" each item.
 * - The interface cycles through 5 Sight, 4 Touch, 3 Sound, 2 Smell, and 1 Taste.
 * - Provides haptic-like visual feedback and a completion state.
 */
export const SensoryGroundingView: React.FC = () => {
  const { returnToPreviousView } = useNavigation();

  const steps = [
    { count: 5, label: "Things you see", icon: Eye, color: "text-emerald-400", instruction: "Look around you. Notice the details." },
    { count: 4, label: "Things you touch", icon: Hand, color: "text-blue-400", instruction: "Feel the texture of your clothes or the air." },
    { count: 3, label: "Things you hear", icon: Ear, color: "text-purple-400", instruction: "Listen for distant or subtle sounds." },
    { count: 2, label: "Things you smell", icon: Wind, color: "text-orange-400", instruction: "Breathe in. Can you detect any scents?" },
    { count: 1, label: "Thing you taste", icon: Smile, color: "text-primary", instruction: "Focus on your mouth. Gum? Coffee? Water?" },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [itemsFound, setItemsFound] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);

  const currentStep = steps[currentStepIndex];

  /**
   * Main interaction handler. Increments the count for the current sense
   * or transitions to the next sense if the count is reached.
   */
  const handleTap = () => {
    if (isCompleted) return;

    setTapAnimation(true);
    setTimeout(() => setTapAnimation(false), 200);

    const nextCount = itemsFound + 1;
    
    if (nextCount >= currentStep.count) {
      if (currentStepIndex < steps.length - 1) {
        // Transition to next sensory step
        setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
            setItemsFound(0);
        }, 300);
      } else {
        // All senses calibrated
        setIsCompleted(true);
      }
    } else {
      setItemsFound(nextCount);
    }
  };

  if (isCompleted) {
      return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden items-center justify-center p-6 text-center animate-in fade-in-0 duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_0%,_transparent_70%)] opacity-10 pointer-events-none"></div>
            
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full"></div>
                <div className="relative h-24 w-24 rounded-full border border-border bg-foreground/5 flex items-center justify-center">
                    <Check size={40} className="text-primary" />
                </div>
            </div>
            
            <h1 className="text-3xl font-light text-foreground mb-2">You are here.</h1>
            <p className="text-secondary text-sm max-w-xs leading-relaxed mb-12">
                Your senses are now calibrated to the present moment. Carry this awareness with you.
            </p>
            
            <button 
                onClick={returnToPreviousView}
                className="bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold py-3 px-8 rounded-full transition-all border border-border"
            >
                Return to Flow
            </button>
        </div>
      );
  }

  const dots = Array.from({ length: currentStep.count }).map((_, i) => i < itemsFound);

  return (
    <div 
        className="flex flex-col h-full bg-background relative overflow-hidden cursor-pointer select-none animate-in fade-in-0 duration-500"
        onClick={handleTap}
    >
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none opacity-5 ${currentStepIndex % 2 === 0 ? 'bg-gradient-to-br from-primary/10 to-background' : 'bg-gradient-to-tl from-accent-purple/10 to-background'}`}></div>
      
      {/* Ripple Animation on Tap */}
      <div className={`absolute inset-0 bg-foreground/5 pointer-events-none transition-opacity duration-200 ${tapAnimation ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Close Header */}
      <button 
          onClick={(e) => { e.stopPropagation(); returnToPreviousView(); }}
          className="absolute top-8 right-6 z-30 p-2 text-foreground/30 hover:text-foreground hover:bg-foreground/10 rounded-full transition-all"
      >
          <X size={24} />
      </button>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
        
        {/* Step Icon */}
        <div className={`mb-8 p-6 rounded-full bg-foreground/5 border border-border transition-all duration-500 ease-out transform ${tapAnimation ? 'scale-110' : 'scale-100'}`}>
            <currentStep.icon size={48} className={`${currentStep.color} transition-colors duration-500`} />
        </div>

        {/* Counter Big Number */}
        <div className="text-[8rem] font-extralight text-foreground/90 leading-none mb-4 tabular-nums tracking-tighter transition-all duration-300">
            {currentStep.count - itemsFound}
        </div>

        {/* Label & Instruction */}
        <h2 className="text-xl font-medium text-foreground mb-2 tracking-wide text-center animate-in fade-in duration-500" key={currentStepIndex}>
            {currentStep.label}
        </h2>
        <p className="text-secondary/60 text-center max-w-xs text-sm animate-in fade-in duration-500" key={`${currentStepIndex}-sub`}>
            {currentStep.instruction}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-3 mt-12 h-4">
            {dots.map((filled, idx) => (
                <div 
                    key={idx} 
                    className={`w-3 h-3 rounded-full transition-all duration-300 border border-border ${filled ? 'bg-foreground scale-125' : 'bg-transparent'}`}
                ></div>
            ))}
        </div>

        <div className="absolute bottom-12 text-[10px] uppercase tracking-[0.2em] text-foreground/20 font-bold">
            Tap anywhere to count
        </div>

      </main>
    </div>
  );
};

export default SensoryGroundingView;

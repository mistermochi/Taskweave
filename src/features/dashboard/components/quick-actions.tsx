"use client";

import React from 'react';
import { Wind, Target, Eye } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useTaskAppStore } from '@/features/task-app/use-task-app';
import { vibrate } from '@/shared/lib/utils';

export const QuickActions = () => {
    const { startBreathing, startGrounding } = useNavigation();
    const { setActiveView } = useTaskAppStore();

    const actions = [
        { label: 'Breathe', icon: Wind, onClick: startBreathing, description: 'Start a breathing exercise' },
        { label: 'Ground', icon: Eye, onClick: startGrounding, description: 'Start a sensory grounding exercise' },
        { label: 'Focus', icon: Target, onClick: () => setActiveView('tasks'), description: 'Switch to task focus view' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
                <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                        vibrate('light');
                        action.onClick();
                    }}
                    aria-label={action.description}
                    title={action.description}
                    className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-lg border border-border flex flex-col items-center gap-2 transition-all active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <action.icon size={20} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-inherit">
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

"use client";

import React from 'react';
import { Wind, MessageSquare, Target, Eye } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useTaskAppStore } from '@/features/task-app/use-task-app';

export const QuickActions = () => {
    const { startBreathing, startGrounding, showChat } = useNavigation();
    const { setActiveView } = useTaskAppStore();

    const actions = [
        { label: 'Breathe', icon: Wind, onClick: startBreathing },
        { label: 'Ground', icon: Eye, onClick: startGrounding },
        { label: 'Journal', icon: MessageSquare, onClick: showChat },
        { label: 'Focus', icon: Target, onClick: () => setActiveView('tasks') },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
                <button
                    key={action.label}
                    onClick={action.onClick}
                    className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-sm border border-border flex flex-col items-center gap-2 transition-colors group"
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

'use client';

import React from 'react';
import { ViewName } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useNavigation } from '@/context/NavigationContext';
import { 
  Inbox, Sun, Settings, Plus, 
  BarChart2, ChevronDown, LucideIcon
} from 'lucide-react';
import { TagTree } from '@/components/TagSidebar';
import { tagApi } from '@/entities/tag';

/**
 * Global navigation sidebar component.
 * Displays user profile, primary view links (Day, Inbox, Insights),
 * and an interactive project (Tag) tree.
 *
 * @component
 */
export const Sidebar: React.FC = () => {
    const { tasks } = useTaskContext();
    const { tags } = useReferenceContext();
    const { settings } = useUserSettings();
    const { 
        currentView, 
        activeTagId,
        selectTag,
        showDashboard,
        showDatabase,
        showInsights,
        showSettings,
        quickAddTask
    } = useNavigation();

    const seed = settings.displayName || 'taskweave';

    const handleAddProject = async () => {
        await tagApi.createTag('New Project', null);
    };

    /**
     * Internal sub-component for rendering a single navigation link.
     */
    const NavItem = ({ onClick, icon: Icon, label, isActive, count, colorClass = "text-muted-foreground" }: { onClick: () => void, icon: LucideIcon, label: string, isActive: boolean, count?: number, colorClass?: string }) => {
        return (
          <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all mb-0.5 group ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}`}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className={isActive ? colorClass : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground transition-colors'} />
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </div>
            {count !== undefined && count > 0 && (
              <span className="text-[10px] bg-sidebar-primary/10 text-sidebar-primary px-1.5 py-0.5 rounded-full font-bold tabular-nums group-hover:bg-sidebar-primary/20">{count}</span>
            )}
          </button>
        );
    };

    return (
        <div className="flex flex-col h-full py-3 bg-sidebar">
            {/* User Profile Area */}
            <div className="px-3 mb-4">
                <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent/50 p-2 rounded-lg transition-colors border border-transparent hover:border-sidebar-border"
                    onClick={showSettings}
                >
                    <div className="h-8 w-8 rounded-lg border border-sidebar-border overflow-hidden bg-sidebar-primary/10 flex items-center justify-center shrink-0">
                        <img src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`} className="h-full w-full object-cover" alt="User avatar" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-sidebar-foreground truncate">{settings.displayName}</span>
                        <span className="text-xxs text-sidebar-foreground/50 truncate">Personal Workspace</span>
                    </div>
                    <ChevronDown size={14} className="text-sidebar-foreground/40" />
                </div>
            </div>

            {/* Mobile Quick Add */}
            <div className="px-3 mb-4 md:hidden">
                <button onClick={() => quickAddTask()} className="w-full flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground font-bold py-2 px-3 rounded-lg shadow-sm">
                    <Plus size={18} />
                    <span className="text-sm">New Task</span>
                </button>
            </div>

            {/* Main Navigation Items */}
            <div className="px-3 space-y-1">
                <NavItem 
                    onClick={showDashboard}
                    isActive={currentView === ViewName.DASHBOARD && !activeTagId}
                    icon={Sun} 
                    label="My Day" 
                    colorClass="text-primary" 
                    count={tasks.filter(t => t.status === 'active' && (!t.dueDate || t.dueDate <= new Date().setHours(23,59,59,999))).length}
                />
                <NavItem 
                    onClick={() => {
                      showDatabase();
                      selectTag(null);
                    }}
                    isActive={currentView === ViewName.DATABASE && !activeTagId}
                    icon={Inbox} 
                    label="Inbox" 
                    colorClass="text-blue-400"
                    count={tasks.filter(t => t.status === 'active').length}
                />
                <NavItem 
                  onClick={showInsights} 
                  isActive={currentView === ViewName.INSIGHTS}
                  icon={BarChart2} 
                  label="Insights" 
                  colorClass="text-accent-purple" 
                />
            </div>

            {/* Project Tree Section */}
            <div className="mt-6 px-3 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2 mb-2 text-sidebar-foreground/50 group">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Projects</span>
                    <button 
                        onClick={handleAddProject}
                        className="opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent p-1 rounded-md transition-all text-sidebar-accent-foreground"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                    <TagTree 
                        tags={tags}
                        tasks={tasks}
                        activeTagId={activeTagId} 
                        onSelectTag={selectTag} 
                    />
                </div>
            </div>

            {/* Global Settings */}
            <div className="px-3 pt-3 mt-auto border-t border-sidebar-border">
                <NavItem 
                  onClick={showSettings} 
                  isActive={currentView === ViewName.SETTINGS} 
                  icon={Settings} 
                  label="Settings" 
                />
            </div>
        </div>
    );
};

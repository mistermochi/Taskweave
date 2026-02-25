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
import { TagService } from '@/services/TagService';

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
        await TagService.getInstance().createTag('New Project', null);
    };

    /**
     * Internal sub-component for rendering a single navigation link.
     */
    const NavItem = ({ onClick, icon: Icon, label, isActive, count, colorClass = "text-secondary" }: { onClick: () => void, icon: LucideIcon, label: string, isActive: boolean, count?: number, colorClass?: string }) => {
        return (
          <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all mb-0.5 group ${isActive ? 'bg-foreground/10 text-foreground' : 'text-secondary hover:bg-foreground/5 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={18} className={isActive ? colorClass : 'text-secondary group-hover:text-foreground transition-colors'} />
              <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
            </div>
            {count !== undefined && count > 0 && (
              <span className="text-xs text-secondary/40 font-medium group-hover:text-secondary/80">{count}</span>
            )}
          </button>
        );
    };

    return (
        <div className="flex flex-col h-full py-4">
            {/* User Profile Area */}
            <div className="px-3 mb-4 flex items-center justify-between">
                <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-foreground/5 p-1.5 -ml-1.5 rounded-lg transition-colors flex-1"
                    onClick={showSettings}
                >
                    <div className="h-6 w-6 rounded-full border border-border overflow-hidden">
                        <img src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`} className="h-full w-full object-cover opacity-80" alt="User avatar" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate max-w-32">{settings.displayName}</span>
                    <ChevronDown size={12} className="text-secondary" />
                </div>
            </div>

            {/* Mobile Quick Add */}
            <div className="px-3 mb-4 md:hidden">
                <button onClick={() => quickAddTask()} className="w-full flex items-center gap-2 text-primary font-bold py-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center">
                        <Plus size={16} />
                    </div>
                    <span>Add Task</span>
                </button>
            </div>

            {/* Main Navigation Items */}
            <div className="px-2 mb-2">
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
            <div className="mt-4 px-2 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2 mb-2 text-secondary group">
                    <span className="text-xs font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">Projects</span>
                    <button 
                        onClick={handleAddProject}
                        className="opacity-0 group-hover:opacity-100 hover:bg-foreground/10 p-1 rounded transition-all text-foreground"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pl-1">
                    <TagTree 
                        tags={tags}
                        tasks={tasks}
                        activeTagId={activeTagId} 
                        onSelectTag={selectTag} 
                    />
                </div>
            </div>

            {/* Global Settings */}
            <div className="px-2 pt-2 mt-auto border-t border-border">
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

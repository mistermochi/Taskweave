'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { 
  Menu, Plus, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

/**
 * Interface for AppLayout props.
 */
interface AppLayoutProps {
  /** The View component to render within the layout. */
  children: React.ReactNode;
}

/**
 * The standard structural layout for the authenticated application.
 * Includes the navigation sidebar (desktop and mobile), a fixed top header,
 * and the main scrollable content area.
 *
 * @component
 * @interaction
 * - Synchronizes with `NavigationContext` to show a global progress bar during view transitions.
 * - Handles sidebar collapse/expand logic for both desktop and mobile views.
 * - Displays a floating action button (FAB) on mobile for quick task entry.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { 
    currentView, 
    activeTagId, 
    activeTaskId, 
    isNavigating,
    showDashboard,
    quickAddTask
  } = useNavigation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Automatically closes the mobile menu whenever the user navigates.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView, activeTagId]);

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Global Transition Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-foreground/10 z-[100]">
            <div className="h-full bg-primary animate-subtle-progress"></div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-background/60 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside 
        className={`
            fixed inset-y-0 left-0 z-50 w-sidebar-mobile bg-surface-highlight border-r border-border transform transition-transform duration-300 ease-productive-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className={`
            hidden md:flex flex-col border-r border-border bg-surface transition-all duration-300 ease-productive-in-out
            ${isSidebarOpen ? 'w-sidebar opacity-100' : 'w-0 opacity-0 overflow-hidden'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background relative transition-all duration-300">
        
        {/* Responsive Header */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="hidden md:flex text-secondary hover:text-foreground p-1 rounded hover:bg-foreground/5 transition-colors"
                    title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </button>

                <button 
                    onClick={() => setIsMobileMenuOpen(true)} 
                    className="md:hidden text-secondary hover:text-foreground"
                >
                    <Menu size={20} />
                </button>

                <button onClick={showDashboard} className="hover:bg-foreground/5 px-2 py-1 rounded transition-colors">
                     <span className="font-semibold text-foreground tracking-tight">Taskweave</span>
                </button>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => quickAddTask()}
                    className="flex items-center gap-1.5 text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline text-sm font-bold">Add task</span>
                </button>
            </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <div className="max-w-4xl mx-auto h-full">
                {children}
            </div>
        </main>

        {/* Mobile Floating Action Button (FAB) */}
        {!activeTaskId && (
            <button 
                onClick={() => quickAddTask()}
                className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-background shadow-lg shadow-primary/30 flex items-center justify-center z-40 active:scale-95 transition-transform"
            >
                <Plus size={28} />
            </button>
        )}

      </div>
    </div>
  );
};

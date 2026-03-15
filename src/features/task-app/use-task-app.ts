import { create } from "zustand";
import { Task } from "@/entities/task";
import { toast } from "sonner";

export type TaskView = 'dashboard' | 'tasks' | 'insights' | 'settings';
export type TaskTab = 'active' | 'done' | 'archived';

type TaskAppStore = {
  activeView: TaskView;
  setActiveView: (view: TaskView) => void;
  taskTab: TaskTab;
  setTaskTab: (tab: TaskTab) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showToast: (message: string, onUndo?: () => void) => void;
};

export const useTaskAppStore = create<TaskAppStore>((set) => ({
  activeView: 'tasks', // Default to tasks for now to maintain current experience
  setActiveView: (view) => set({ activeView: view }),
  taskTab: 'active',
  setTaskTab: (tab) => set({ taskTab: tab }),
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  selectedTagId: null,
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  isCollapsed: false,
  setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  showToast: (message, onUndo) => {
    if (onUndo) {
      toast(message, {
        action: {
          label: "Undo",
          onClick: onUndo,
        },
      });
    } else {
      toast(message);
    }
  },
}));

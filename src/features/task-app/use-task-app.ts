import { create } from "zustand";
import { Task } from "@/entities/task";
import { toast } from "sonner";

export type TaskView = 'dashboard' | 'tasks' | 'insights' | 'settings';

type TaskAppStore = {
  activeView: TaskView;
  setActiveView: (view: TaskView) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showToast: (message: string, onUndo?: () => void) => void;
};

export const useTaskAppStore = create<TaskAppStore>((set) => ({
  activeView: 'tasks', // Default to tasks for now to maintain current experience
  setActiveView: (view) => set({ activeView: view }),
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  selectedTagId: null,
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),
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

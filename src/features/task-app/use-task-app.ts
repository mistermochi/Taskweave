import { create } from "zustand";
import { Task } from "@/entities/task";
import { Tag } from "@/entities/tag";
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
  // Optimistic State
  optimisticTasks: Record<string, Partial<Task> | null>;
  setOptimisticTask: (id: string, task: Partial<Task> | null) => void;
  clearOptimisticTask: (id: string) => void;
  optimisticTags: Record<string, Partial<Tag> | null>;
  setOptimisticTag: (id: string, tag: Partial<Tag> | null) => void;
  clearOptimisticTag: (id: string) => void;
};

export const useTaskAppStore = create<TaskAppStore>((set) => ({
  activeView: 'dashboard', // Default to dashboard for verification
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
  optimisticTasks: {},
  setOptimisticTask: (id, task) => set((state) => ({
    optimisticTasks: { ...state.optimisticTasks, [id]: task }
  })),
  clearOptimisticTask: (id) => set((state) => {
    const { [id]: _, ...rest } = state.optimisticTasks;
    return { optimisticTasks: rest };
  }),
  optimisticTags: {},
  setOptimisticTag: (id, tag) => set((state) => ({
    optimisticTags: { ...state.optimisticTags, [id]: tag }
  })),
  clearOptimisticTag: (id) => set((state) => {
    const { [id]: _, ...rest } = state.optimisticTags;
    return { optimisticTags: rest };
  }),
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

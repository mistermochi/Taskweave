import { create } from "zustand";
import { Task } from "@/entities/task";

type ToastState = {
  message: string;
  isVisible: boolean;
  onUndo?: () => void;
};

type TaskAppStore = {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  toast: ToastState;
  showToast: (message: string, onUndo?: () => void) => void;
  hideToast: () => void;
};

let toastTimeout: NodeJS.Timeout | null = null;

export const useTaskAppStore = create<TaskAppStore>((set, get) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  selectedTagId: null,
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),
  showSettings: false,
  setShowSettings: (show) =>
    set({ showSettings: show, selectedTask: show ? null : null }),
  toast: {
    message: "",
    isVisible: false,
  },
  showToast: (message, onUndo) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ toast: { message, isVisible: true, onUndo } });
    toastTimeout = setTimeout(() => {
      get().hideToast();
    }, 5000);
  },
  hideToast: () => {
    set((state) => ({ toast: { ...state.toast, isVisible: false } }));
  },
}));

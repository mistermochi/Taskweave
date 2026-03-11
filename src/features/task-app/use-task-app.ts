import { create } from "zustand";
import { Task } from "@/entities/task";
import { toast } from "sonner";

type TaskAppStore = {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showToast: (message: string, onUndo?: () => void) => void;
};

export const useTaskAppStore = create<TaskAppStore>((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  selectedTagId: null,
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),
  showSettings: false,
  setShowSettings: (show) =>
    set({ showSettings: show, selectedTask: show ? null : null }),
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

import { create } from "zustand";
import { Task } from "@/entities/task";

type TaskAppStore = {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
};

export const useTaskAppStore = create<TaskAppStore>((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  selectedTagId: null,
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId })
}));

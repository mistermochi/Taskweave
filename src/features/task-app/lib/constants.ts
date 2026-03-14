import { Task } from "@/entities/task";

export const createDefaultTask = (): Task => ({
  id: "new",
  title: "",
  status: "active",
  category: "",
  energy: "Medium",
  duration: 0,
  createdAt: Date.now(),
  blockedBy: [],
} as Task);

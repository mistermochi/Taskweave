import { create } from "zustand";
import { Task } from "@/entities/task";

type MailStore = {
  selectedMail: Task | null;
  setSelectedMail: (mail: Task | null) => void;
};

export const useMailStore = create<MailStore>((set) => ({
  selectedMail: null,
  setSelectedMail: (mail) => set({ selectedMail: mail })
}));

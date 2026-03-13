"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { ProfileForm } from "./profile-form";
import { AppearanceForm } from "./appearance-form";
import { ScheduleForm } from "./schedule-form";
import { SensorsForm } from "./sensors-form";
import { IntegrationsForm } from "./integrations-form";
import { MentalModelForm } from "./mental-model-form";
import { AccountForm } from "./account-form";
import { AppHeader } from "@/shared/ui/ui/app-header";
import { TaskNavigation } from "@/features/task-app/components/task-navigation";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { TaskEntity } from "@/entities/task";
import { Tag } from "@/entities/tag";

const settingsTabs = [
  {
    id: "profile",
    title: "Profile",
  },
  {
    id: "appearance",
    title: "Appearance",
  },
  {
    id: "schedule",
    title: "Schedule",
  },
  {
    id: "sensors",
    title: "Sensors",
  },
  {
    id: "integrations",
    title: "Integrations",
  },
  {
    id: "mental-model",
    title: "Mental Model",
  },
  {
    id: "account",
    title: "Account",
  },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = React.useState("profile");
  const { data: tasks } = useFirestoreCollection<TaskEntity>("tasks");
  const { data: tags } = useFirestoreCollection<Tag>("tags");

  return (
    <div className="h-full flex flex-col">
      <AppHeader
        title="Settings"
        subtitle="Account preferences"
        nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
      />
      <div className="flex-1 flex flex-col lg:flex-row lg:space-x-12 lg:space-y-0 p-4">
        <aside className="lg:w-1/5">
          <SidebarNav
            items={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </aside>
        <div className="flex-1 lg:max-w-2xl mt-4 lg:mt-0">
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "appearance" && <AppearanceForm />}
          {activeTab === "schedule" && <ScheduleForm />}
          {activeTab === "sensors" && <SensorsForm />}
          {activeTab === "integrations" && <IntegrationsForm />}
          {activeTab === "mental-model" && <MentalModelForm />}
          {activeTab === "account" && <AccountForm />}
        </div>
      </div>
    </div>
  );
}

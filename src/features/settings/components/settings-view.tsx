"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Separator } from "@/shared/ui/ui/separator";
import { ProfileForm } from "./profile-form";
import { AppearanceForm } from "./appearance-form";
import { ScheduleForm } from "./schedule-form";
import { SensorsForm } from "./sensors-form";
import { IntegrationsForm } from "./integrations-form";
import { MentalModelForm } from "./mental-model-form";
import { AccountForm } from "./account-form";

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

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-0.5 px-4 py-4">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
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

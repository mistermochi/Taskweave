"use client";

import * as React from "react";
import { ProfileForm } from "./profile-form";
import { AppearanceForm } from "./appearance-form";
import { ScheduleForm } from "./schedule-form";
import { SensorsForm } from "./sensors-form";
import { IntegrationsForm } from "./integrations-form";
import { MentalModelForm } from "./mental-model-form";
import { AccountForm } from "./account-form";
import { AppHeader } from "@/shared/ui/ui/app-header";
import { TaskNavigation } from "@/features/task-app/components/task-navigation";
import { useTaskContext } from "@/context/TaskContext";
import { useReferenceContext } from "@/context/ReferenceContext";
import { ScrollArea } from "@/shared/ui/ui/scroll-area";
import { Separator } from "@/shared/ui/ui/separator";

export function SettingsView() {
  const { tasks } = useTaskContext();
  const { tags } = useReferenceContext();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <AppHeader
        title="Settings"
        subtitle="Account preferences"
        nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
      />
      <ScrollArea className="flex-1">
        <div className="container max-w-6xl mx-auto py-6 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <section id="profile" className="lg:col-span-1">
              <ProfileForm />
            </section>
            <section id="appearance">
              <AppearanceForm />
            </section>
            <section id="schedule">
              <ScheduleForm />
            </section>
            <section id="sensors">
              <SensorsForm />
            </section>
            <section id="integrations">
              <IntegrationsForm />
            </section>
            <section id="mental-model">
              <MentalModelForm />
            </section>
            <section id="account">
              <AccountForm />
            </section>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

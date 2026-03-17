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
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { TaskEntity } from "@/entities/task";
import { Tag } from "@/entities/tag";
import { ScrollArea } from "@/shared/ui/ui/scroll-area";
import { Separator } from "@/shared/ui/ui/separator";

export function SettingsView() {
  const { data: tasks } = useFirestoreCollection<TaskEntity>("tasks");
  const { data: tags } = useFirestoreCollection<Tag>("tags");

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <AppHeader
        title="Settings"
        subtitle="Account preferences"
        nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
      />
      <ScrollArea className="flex-1">
        <div className="container max-w-2xl mx-auto py-10 px-4 space-y-12">
          <section id="profile">
            <ProfileForm />
          </section>
          <Separator />
          <section id="appearance">
            <AppearanceForm />
          </section>
          <Separator />
          <section id="schedule">
            <ScheduleForm />
          </section>
          <Separator />
          <section id="sensors">
            <SensorsForm />
          </section>
          <Separator />
          <section id="integrations">
            <IntegrationsForm />
          </section>
          <Separator />
          <section id="mental-model">
            <MentalModelForm />
          </section>
          <Separator />
          <section id="account">
            <AccountForm />
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

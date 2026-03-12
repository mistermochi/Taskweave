"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Button } from "@/shared/ui/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/shared/ui/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/ui/select";
import { User, BedDouble } from 'lucide-react';
import { toast } from "sonner";

const scheduleFormSchema = z.object({
  workStartHour: z.string(),
  workEndHour: z.string(),
  sleepStartHour: z.string(),
  sleepEndHour: z.string(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i % 12 || 12} ${i >= 12 ? 'PM' : 'AM'}`
}));

export function ScheduleForm() {
  const { settings, updateSettings } = useUserSettings();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      workStartHour: (settings.workStartHour ?? 9).toString(),
      workEndHour: (settings.workEndHour ?? 17).toString(),
      sleepStartHour: (settings.sleepStartHour ?? 22).toString(),
      sleepEndHour: (settings.sleepEndHour ?? 7).toString(),
    },
  });

  async function onSubmit(data: ScheduleFormValues) {
    try {
      await updateSettings({
        workStartHour: parseInt(data.workStartHour),
        workEndHour: parseInt(data.workEndHour),
        sleepStartHour: parseInt(data.sleepStartHour),
        sleepEndHour: parseInt(data.sleepEndHour),
      });
      toast.success("Schedule updated successfully.");
    } catch (error) {
      toast.error("Failed to update schedule.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Typical Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Define your typical work and sleep hours to help the engine schedule tasks.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6">
            {/* Work Schedule */}
            <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold">Work Schedule</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workStartHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Start Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select start hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workEndHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">End Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sleep Routine */}
            <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold">Sleep Routine</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sleepStartHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Start Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select start hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sleepEndHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">End Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}

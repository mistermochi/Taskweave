"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Button } from "@/shared/ui/ui/button";
import {
  Form,
  FormControl,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
import { User, BedDouble, Save } from 'lucide-react';
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
      form.reset(data);
    } catch (error) {
      toast.error("Failed to update schedule.");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Schedule</CardTitle>
        <CardDescription>
          Your typical work and sleep hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              {/* Work Schedule */}
              <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="workStartHour"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] text-muted-foreground">Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h.value} value={h.value} className="text-xs">{h.label}</SelectItem>
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
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] text-muted-foreground">End Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h.value} value={h.value} className="text-xs">{h.label}</SelectItem>
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
              <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <BedDouble className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sleep Routine</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="sleepStartHour"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] text-muted-foreground">Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h.value} value={h.value} className="text-xs">{h.label}</SelectItem>
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
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] text-muted-foreground">End Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h.value} value={h.value} className="text-xs">{h.label}</SelectItem>
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
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={!form.formState.isDirty}
            >
              <Save className="h-3 w-3 mr-2" />
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/shared/ui/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/ui/avatar";
import { auth } from "@/shared/api/firebase";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters."
    })
    .max(30, {
      message: "Username must not be longer than 30 characters."
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { settings, updateSettings } = useUserSettings();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: settings.displayName || "",
    },
    mode: "onChange"
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateSettings({ displayName: data.username });
      toast.success("Profile updated successfully.");
      form.reset(data);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    }
  }

  const seed = settings.displayName || 'taskweave';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card text-card-foreground">
        <Avatar className="h-14 w-14 border border-border shrink-0">
          <AvatarImage
            src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`}
            alt={settings.displayName || "User"}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {settings.displayName?.substring(0, 2).toUpperCase() || "TW"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-lg font-medium">{settings.displayName}</div>
          <div className="text-xs text-muted-foreground">{auth.currentUser?.email}</div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Update profile
        </Button>
      </form>
    </Form>
    </div>
  );
}

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
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
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your public profile and display name.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 py-2 border-b">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`}
              alt={settings.displayName || "User"}
            />
            <AvatarFallback>
              {settings.displayName?.substring(0, 2).toUpperCase() || "TW"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="text-sm font-semibold truncate">{settings.displayName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{auth.currentUser?.email}</div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} className="h-9" />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              Update Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

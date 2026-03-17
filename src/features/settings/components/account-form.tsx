"use client";

import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/shared/api/firebase';
import { Button } from "@/shared/ui/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
import { LogOut, UserCircle } from 'lucide-react';
import { toast } from "sonner";

export function AccountForm() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your account security and sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <UserCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{auth.currentUser?.email}</span>
            <span className="text-xs text-muted-foreground">Personal Account</span>
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

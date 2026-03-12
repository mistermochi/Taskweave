"use client";

import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/shared/api/firebase';
import { Button } from "@/shared/ui/ui/button";
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and sessions.
        </p>
      </div>

      <div className="p-6 rounded-xl border bg-card space-y-6">
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
      </div>
    </div>
  );
}

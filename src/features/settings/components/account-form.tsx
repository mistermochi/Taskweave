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
      <CardHeader className="pb-4">
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Security and sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">{auth.currentUser?.email}</span>
            <span className="text-[10px] text-muted-foreground">Personal Account</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={handleSignOut}
          >
            <LogOut className="h-3 w-3 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

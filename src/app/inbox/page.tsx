"use client";

import { Mail } from "@/features/mail-app/components/mail";
import { accounts, mails } from "@/features/mail-app/data";

export default function InboxPage() {
  // Use default values for static export compatibility
  const defaultLayout = [20, 32, 48];
  const defaultCollapsed = false;

  return (
    <div className="h-screen rounded-md border bg-background text-foreground">
      <Mail
        accounts={accounts}
        mails={mails}
        defaultLayout={defaultLayout}
        defaultCollapsed={defaultCollapsed}
        navCollapsedSize={4}
      />
    </div>
  );
}

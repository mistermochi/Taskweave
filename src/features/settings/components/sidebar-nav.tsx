"use client";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/ui/button";
import { Button } from "@/shared/ui/ui/button";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    id: string;
    title: string;
  }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SidebarNav({ className, items, activeTab, onTabChange, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)}
      {...props}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          onClick={() => onTabChange(item.id)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            activeTab === item.id ? "bg-muted hover:bg-muted" : "hover:bg-muted",
            "justify-start w-full"
          )}>
          {item.title}
        </Button>
      ))}
    </nav>
  );
}

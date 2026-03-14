"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ReactNode } from "react";

import { buttonVariants } from "@/shared/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { useTaskAppStore, TaskView } from "../use-task-app";

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    dot?: ReactNode;
    variant: "default" | "ghost";
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  const { activeView, setActiveView } = useTaskAppStore();

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const viewId = link.title.toLowerCase() as TaskView;
          const isActive = activeView === viewId;
          const variant = isActive ? "default" : "ghost";

          const href = `#/${viewId}`;
          const handleClick = () => setActiveView(viewId);

          if (isCollapsed) {
            return (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    onClick={handleClick}
                    className={cn(
                      buttonVariants({ variant: variant, size: "icon" }),
                      "h-9 w-9",
                      variant === "default" &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}>
                    {link.dot ?? <link.icon className="h-4 w-4" />}
                    <span className="sr-only">{link.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {link.title}
                  {link.label && (
                    <span className="ml-auto text-muted-foreground">
                      {link.label}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={index}
              href={href}
              onClick={handleClick}
              className={cn(
                buttonVariants({ variant: variant, size: "sm" }),
                variant === "default" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start"
              )}>
              {link.dot ?? <link.icon className="mr-2 h-4 w-4" />}
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    variant === "default" && "text-background dark:text-white"
                  )}>
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ReactNode } from "react";

import { buttonVariants } from "@/shared/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";
import { useTaskAppStore } from "../use-task-app";

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
  const { showSettings, setShowSettings } = useTaskAppStore();

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-1 py-0 data-[collapsed=true]:py-0">
      <nav className="grid gap-1 px-0 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-0">
        {links.map((link, index) => {
          const isSettings = link.title === "Settings";
          const isActive = (isSettings && showSettings) || (!showSettings && link.variant === "default");
          const variant = isActive ? "default" : "ghost";

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (isSettings) {
              setShowSettings(true);
            } else {
              setShowSettings(false);
            }
          };

          if (isCollapsed) {
            return (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="#"
                    onClick={handleClick}
                    className={cn(
                      buttonVariants({ variant: variant, size: "icon" }),
                      "h-9 w-9",
                      variant === "default" &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}>
                    {link.dot ?? <link.icon className="size-4" />}
                    <span className="sr-only">{link.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {link.title}
                  {link.label && <span className="text-muted-foreground ml-auto">{link.label}</span>}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={index}
              href="#"
              onClick={handleClick}
              className={cn(
                buttonVariants({ variant: variant, size: "sm" }),
                variant === "default" &&
                  "dark:bg-muted dark:hover:bg-muted dark:text-white dark:hover:text-white",
                "justify-start"
              )}>
              {link.dot ?? <link.icon className="mr-2 h-4 w-4" />}
              <span className="flex-1">{link.title}</span>
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

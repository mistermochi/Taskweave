import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Separator } from "@/shared/ui/ui/separator";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  nav,
  actions,
  className,
}: AppHeaderProps) {
  return (
    <div className="flex flex-col shrink-0">
      <div className={cn("flex h-[52px] items-center px-4", className)}>
        <div className="flex items-center gap-2 min-w-0">
          {nav && <div className="md:hidden flex items-center">{nav}</div>}
          <div className="flex items-baseline gap-2 truncate">
            <h1 className="text-xl font-bold truncate">{title}</h1>
            {subtitle && (
              <span className="text-sm font-medium text-muted-foreground truncate hidden sm:inline">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      <Separator />
    </div>
  );
}

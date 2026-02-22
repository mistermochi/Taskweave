
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const iconBadgeVariants = cva(
  'rounded-full border flex items-center justify-center shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-surface-highlight text-secondary border-white/5',
        accent: 'bg-accent/10 text-accent border-accent/20',
        neutral: 'bg-foreground/5 text-secondary border-border',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
      },
      size: {
        sm: 'w-8 h-8 p-1.5',
        md: 'w-10 h-10 p-2',
        lg: 'w-12 h-12 p-2.5',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof iconBadgeVariants> {
  icon: LucideIcon;
  className?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({ icon: Icon, className, variant, size, ...props }) => {
  return (
    <div {...props} className={iconBadgeVariants({ variant, size, className })}>
      <Icon className="w-full h-full" />
    </div>
  );
};

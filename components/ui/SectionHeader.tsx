
import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, className='' }) => (
  <div className={`flex items-end justify-between mb-4 px-1 ${className}`}>
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-white/60 font-medium mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

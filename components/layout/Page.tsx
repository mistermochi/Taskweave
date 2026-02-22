
import React from 'react';

// --- Page Root ---
// Handles the main view container, background, and flex layout.
interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Root: React.FC<PageRootProps> = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col h-full bg-background relative overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

// --- Page Header ---
// Standardized header with Title, Subtitle, and Right-side Actions.
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode; 
  className?: string;
}

const Header: React.FC<PageHeaderProps> = ({ title, subtitle, actions, children, className = '' }) => (
  <header className={`shrink-0 px-6 pt-8 pb-4 flex items-center justify-between z-10 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 truncate">
        <span className="truncate">{title}</span> 
        {subtitle && <span className="text-sm font-medium text-secondary/50 font-normal">{subtitle}</span>}
      </h1>
    </div>
    <div className="flex items-center gap-2">
      {actions}
    </div>
    {children}
  </header>
);

// --- Page Content ---
// The main scrollable area with consistent padding.
interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Content: React.FC<PageContentProps> = ({ children, className = '', ...props }) => (
  <div className={`flex-1 overflow-y-auto no-scrollbar px-6 pb-24 ${className}`} {...props}>
    {children}
  </div>
);

// --- Page Section ---
// Wrapper for vertical rhythm.
const Section: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <section className={`mb-8 ${className}`}>
        {children}
    </section>
);

export const Page = {
  Root,
  Header,
  Content,
  Section
};

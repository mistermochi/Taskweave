import React from 'react';
import { AppHeader } from '../ui/ui/app-header';

/**
 * Props for Page.Root component.
 */
interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Standardized container for a top-level view.
 * Handles background consistency and flex layout.
 */
const Root: React.FC<PageRootProps> = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col h-full bg-background relative overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Props for Page.Header component.
 */
interface PageHeaderProps {
  /** The primary page title. */
  title: string;
  /** Optional secondary text displayed next to the title. */
  subtitle?: string;
  /** Elements to render on the right side of the header. */
  actions?: React.ReactNode;
  /** Optional additional content to render within the header. */
  children?: React.ReactNode; 
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Consistent header component for all internal pages.
 * Supports titles, subtitles, and action buttons.
 * @deprecated Use AppHeader directly for the unified layout.
 */
const Header: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className = '' }) => (
  <AppHeader
    title={title}
    subtitle={subtitle}
    actions={actions}
    className={className}
  />
);

/**
 * Props for Page.Content component.
 */
interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Main scrollable content area for a page.
 * Implements standard padding and handles overflow.
 */
const Content: React.FC<PageContentProps> = ({ children, className = '', ...props }) => (
  <div className={`flex-1 overflow-y-auto no-scrollbar px-6 pb-24 ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Semantic section wrapper for content organization.
 */
const Section: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <section className={`mb-8 ${className}`}>
        {children}
    </section>
);

/**
 * Compound component for building standardized application pages.
 * Use as `<Page.Root>`, `<Page.Header>`, etc.
 */
export const Page = {
  Root,
  Header,
  Content,
  Section
};

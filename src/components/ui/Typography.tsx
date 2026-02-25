import React from 'react';

/**
 * Reusable Heading component for consistent typography.
 * Supports different semantic levels (h1, h2, h3) and a specialized section style.
 *
 * @component
 */
export const Heading: React.FC<{ children: React.ReactNode; variant?: 'h1' | 'h2' | 'h3' | 'section'; className?: string }> = ({ children, variant = 'h1', className = '' }) => {
    const styles = {
        h1: "text-2xl font-bold text-foreground tracking-tight",
        h2: "text-xl font-semibold text-foreground",
        h3: "text-lg font-medium text-foreground",
        section: "text-xs font-bold uppercase tracking-widest text-secondary mb-2 flex items-center gap-2"
    };
    return <div className={`${styles[variant]} ${className}`}>{children}</div>;
};

/**
 * Reusable Text component for body content and metadata.
 *
 * @component
 */
export const Text: React.FC<{ children: React.ReactNode; variant?: 'body' | 'muted' | 'tiny'; className?: string }> = ({ children, variant = 'body', className = '' }) => {
    const styles = {
        body: "text-sm text-foreground/90 leading-relaxed",
        muted: "text-sm text-secondary/60",
        tiny: "text-xxs font-medium text-secondary/50"
    };
    return <p className={`${styles[variant]} ${className}`}>{children}</p>;
};

import React from 'react';

/**
 * Basic Card component for grouping related content.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative overflow-hidden rounded-2xl bg-surface border border-border shadow-sm ${className}`}
    {...props}
  />
));
Card.displayName = 'Card';

/**
 * Header section for a Card, typically containing a title and description.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-start gap-3 relative z-10 p-5 ${className}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * Main body section for a Card.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-5 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * Standardized title style for Cards.
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-sm font-bold uppercase tracking-wider text-secondary mb-1 ${className}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Standardized description/subtitle style for Cards.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-xs text-secondary/60 ${className}`}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Compound component for building consistent UI cards.
 * Use as `<Card>`, `<CardHeader>`, etc.
 */
export { Card, CardHeader, CardContent, CardTitle, CardDescription };

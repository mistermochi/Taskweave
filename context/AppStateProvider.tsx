import React, { PropsWithChildren } from 'react';
import { TaskProvider } from './TaskContext';
import { NavigationProvider } from './NavigationContext';
import { ContextServiceProvider } from './ContextServiceContext';

/**
 * Compound provider that bundles UI-related state providers.
 * Manages the order of operations for environmental context, task data, and navigation.
 *
 * @param children - The application components requiring access to UI state.
 */
export const AppStateProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ContextServiceProvider>
      <TaskProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </TaskProvider>
    </ContextServiceProvider>
  );
};

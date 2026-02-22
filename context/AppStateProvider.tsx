import React, { PropsWithChildren } from 'react';
import { TaskProvider } from './TaskContext';
import { NavigationProvider } from './NavigationContext';
import { ContextServiceProvider } from './ContextServiceContext';

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

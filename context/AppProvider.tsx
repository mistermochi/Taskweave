import React, { PropsWithChildren } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { VitalsProvider } from '@/context/VitalsContext';
import { ReferenceProvider } from '@/context/ReferenceContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { EnvironmentProvider } from '@/context/EnvironmentContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <EnvironmentProvider>
      <ReferenceProvider>
        <VitalsProvider>
          <TaskProvider>
            <NavigationProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </NavigationProvider>
          </TaskProvider>
        </VitalsProvider>
      </ReferenceProvider>
    </EnvironmentProvider>
  );
};

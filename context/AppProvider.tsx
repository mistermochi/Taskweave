import React, { PropsWithChildren } from 'react';
import { DataProviders } from './DataProviders';
import { AppStateProvider } from './AppStateProvider';
import { ThemeProvider } from '../components/ThemeProvider';

/**
 * The Root Provider of the application.
 * It orchestrates the hierarchy of all global context providers, including
 * data subscriptions, UI state, and theming.
 *
 * @param children - The main application component tree.
 */
export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <DataProviders>
      <AppStateProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AppStateProvider>
    </DataProviders>
  );
};

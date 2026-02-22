import React, { PropsWithChildren } from 'react';
import { DataProviders } from './DataProviders';
import { AppStateProvider } from './AppStateProvider';
import { ThemeProvider } from '../components/ThemeProvider';

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

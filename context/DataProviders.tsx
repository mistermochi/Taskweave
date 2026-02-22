import React, { PropsWithChildren } from 'react';
import { VitalsProvider } from './VitalsContext';
import { ReferenceProvider } from './ReferenceContext';
import { EnvironmentProvider } from './EnvironmentContext';

export const DataProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <EnvironmentProvider>
      <ReferenceProvider>
        <VitalsProvider>
          {children}
        </VitalsProvider>
      </ReferenceProvider>
    </EnvironmentProvider>
  );
};

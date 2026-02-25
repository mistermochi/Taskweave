import React, { PropsWithChildren } from 'react';
import { VitalsProvider } from './VitalsContext';
import { ReferenceProvider } from './ReferenceContext';
import { EnvironmentProvider } from './EnvironmentContext';

/**
 * Compound provider that bundles all data-oriented context providers.
 * Groups together environmental flags, reference materials, and vitals tracking.
 *
 * @param children - The application components requiring access to domain data.
 */
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

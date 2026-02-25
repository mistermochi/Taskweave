'use client';

import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';

/**
 * Interface for static environmental flags.
 */
interface EnvironmentContextType {
  /** Whether the application is running in a development environment. */
  isDevelopment: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType>({ isDevelopment: false });

/**
 * Provider for static environment-level flags.
 * Useful for conditionally rendering debug tools or enabling/disabling
 * certain features in production.
 */
export const EnvironmentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const value = useMemo(() => ({ isDevelopment }), [isDevelopment]);

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};

/**
 * Hook to consume environmental flags.
 * @throws Error if used outside of `EnvironmentProvider`.
 */
export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

'use client';

import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';

interface EnvironmentContextType {
  isDevelopment: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType>({ isDevelopment: false });

export const EnvironmentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // isDevelopment is now calculated directly from the Node.js environment variable,
  // which is baked in at build time by Next.js.
  const isDevelopment = process.env.NODE_ENV === 'development';

  const value = useMemo(() => ({ isDevelopment }), [isDevelopment]);

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

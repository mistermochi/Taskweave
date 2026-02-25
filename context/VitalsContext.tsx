'use client';

import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import { orderBy, limit } from 'firebase/firestore';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { UserVital } from '@/types';

/**
 * Interface for the user vitals state (Energy, Mood, Focus).
 */
interface VitalsContextType {
  /** Array of the most recent user vital logs. */
  vitals: UserVital[];
  /** Loading state for the vitals subscription. */
  loading: boolean;
}

const VitalsContext = createContext<VitalsContextType>({ vitals: [], loading: true });

/**
 * Provider that manages the user's biological and focus history.
 * Subscribes to the 'vitals' collection and limits data to the 100 most
 * recent entries to optimize performance and bandwidth.
 */
export const VitalsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const constraints = useMemo(() => [orderBy('timestamp', 'desc'), limit(100)], []);
  const { data: vitals, loading } = useFirestoreCollection<UserVital>('vitals', constraints);

  const value = useMemo(() => ({ vitals, loading }), [vitals, loading]);

  return <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>;
};

/**
 * Hook to consume vitals data context.
 */
export const useVitalsContext = () => useContext(VitalsContext);

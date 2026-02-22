'use client';

import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import { orderBy, limit } from 'firebase/firestore';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { UserVital } from '@/types';

interface VitalsContextType {
  vitals: UserVital[];
  loading: boolean;
}

const VitalsContext = createContext<VitalsContextType>({ vitals: [], loading: true });

export const VitalsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Limit to last 100 entries to prevent massive history download
  const constraints = useMemo(() => [orderBy('timestamp', 'desc'), limit(100)], []);
  const { data: vitals, loading } = useFirestoreCollection<UserVital>('vitals', constraints);

  const value = useMemo(() => ({ vitals, loading }), [vitals, loading]);

  return <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>;
};

export const useVitalsContext = () => useContext(VitalsContext);

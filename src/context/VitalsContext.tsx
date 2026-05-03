'use client';

import React, { createContext, useContext, useMemo, useRef, PropsWithChildren } from 'react';
import { orderBy, limit } from 'firebase/firestore';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { UserVital } from '@/entities/vital';

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
  const { data: rawVitals, loading } = useFirestoreCollection<UserVital>('vitals', constraints);

  const prevVitalsMapRef = useRef<Record<string, UserVital>>({});
  const prevVitalsRef = useRef<UserVital[]>([]);

  const vitals = useMemo(() => {
    const newMap: Record<string, UserVital> = {};
    const newList: UserVital[] = [];
    const prevMap = prevVitalsMapRef.current;

    rawVitals.forEach(v => {
      const prev = prevMap[v.id];
      if (
        prev &&
        prev.timestamp === v.timestamp &&
        prev.type === v.type &&
        prev.value === v.value
      ) {
        newMap[v.id] = prev;
      } else {
        newMap[v.id] = v;
      }
      newList.push(newMap[v.id]);
    });

    const hasChanged = newList.length !== prevVitalsRef.current.length ||
                       newList.some((v, i) => v !== prevVitalsRef.current[i]);

    const finalVitals = hasChanged ? newList : prevVitalsRef.current;

    prevVitalsMapRef.current = newMap;
    prevVitalsRef.current = finalVitals;

    return finalVitals;
  }, [rawVitals]);

  const value = useMemo(() => ({ vitals, loading }), [vitals, loading]);

  return <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>;
};

/**
 * Hook to consume vitals data context.
 */
export const useVitalsContext = () => useContext(VitalsContext);

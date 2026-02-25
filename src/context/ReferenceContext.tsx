'use client';

import React, { createContext, useContext, useMemo, useEffect, PropsWithChildren } from 'react';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Tag, tagApi } from '@/entities/tag';

/**
 * Interface for the reference data state (Tags, Categories).
 */
interface ReferenceContextType {
  /** Full list of category tags for the user. */
  tags: Tag[];
  /** Loading state for the tags subscription. */
  loading: boolean;
}

const ReferenceContext = createContext<ReferenceContextType>({ tags: [], loading: true });

/**
 * Provider that maintains a real-time subscription to the user's tags.
 * Also handles the "First-Run" logic to seed default tags if the user's
 * list is empty.
 */
export const ReferenceProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: tags, loading } = useFirestoreCollection<Tag>('tags');

  /**
   * Seeding logic: Ensures every user has at least the default system tags
   * (Work, Personal, etc) for a better initial experience.
   */
  useEffect(() => {
    if (!loading && tags.length === 0) {
        tagApi.initializeDefaultsIfEmpty();
    }
  }, [loading, tags.length]);

  const value = useMemo(() => ({ tags, loading }), [tags, loading]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
};

/**
 * Hook to consume the reference/tag data context.
 */
export const useReferenceContext = () => useContext(ReferenceContext);

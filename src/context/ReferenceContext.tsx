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
  /** Lookup map for tags keyed by their unique ID. */
  tagsMap: Record<string, Tag>;
  /** Loading state for the tags subscription. */
  loading: boolean;
  /** Whether there are local writes that have not yet been synchronized with the server. */
  hasPendingWrites: boolean;
}

const ReferenceContext = createContext<ReferenceContextType>({
  tags: [],
  tagsMap: {},
  loading: true,
  hasPendingWrites: false
});

/**
 * Provider that maintains a real-time subscription to the user's tags.
 * Also handles the "First-Run" logic to seed default tags if the user's
 * list is empty.
 */
export const ReferenceProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: tags, loading, hasPendingWrites } = useFirestoreCollection<Tag>('tags');

  const tagsMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {} as Record<string, Tag>);
  }, [tags]);

  /**
   * Seeding logic: Ensures every user has at least the default system tags
   * (Work, Personal, etc) for a better initial experience.
   */
  useEffect(() => {
    if (!loading && tags.length === 0) {
        tagApi.initializeDefaultsIfEmpty();
    }
  }, [loading, tags.length]);

  const value = useMemo(() => ({
    tags,
    tagsMap,
    loading,
    hasPendingWrites
  }), [tags, tagsMap, loading, hasPendingWrites]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
};

/**
 * Hook to consume the reference/tag data context.
 */
export const useReferenceContext = () => useContext(ReferenceContext);

'use client';

import React, { createContext, useContext, useMemo, useEffect, useRef, PropsWithChildren } from 'react';
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

  const prevTagsRef = useRef<Tag[]>([]);
  const prevTagsMapRef = useRef<Record<string, Tag>>({});

  const { stabilizedTags: tagsFinal, tagsMap } = useMemo(() => {
    const newMap: Record<string, Tag> = {};
    const newList: Tag[] = [];
    const prevMap = prevTagsMapRef.current;
    const prevTags = prevTagsRef.current;

    let hasChanges = tags.length !== prevTags.length;

    tags.forEach((tag, i) => {
      const prev = prevMap[tag.id];
      // Tags don't have updatedAt currently, so we compare fields
      if (prev && prev.name === tag.name && prev.parentId === tag.parentId && prev.color === tag.color && prev.order === tag.order) {
        newMap[tag.id] = prev;
      } else {
        newMap[tag.id] = tag;
        hasChanges = true;
      }
      newList.push(newMap[tag.id]);
      if (!hasChanges && prevTags[i]?.id !== tag.id) {
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return { stabilizedTags: prevTags, tagsMap: prevMap };
    }

    prevTagsRef.current = newList;
    prevTagsMapRef.current = newMap;
    return { stabilizedTags: newList, tagsMap: newMap };
  }, [tags]);

  /**
   * Seeding logic: Ensures every user has at least the default system tags
   * (Work, Personal, etc) for a better initial experience.
   */
  useEffect(() => {
    if (!loading && tagsFinal.length === 0) {
        tagApi.initializeDefaultsIfEmpty();
    }
  }, [loading, tagsFinal.length]);

  const value = useMemo(() => ({
    tags: tagsFinal,
    tagsMap,
    loading,
    hasPendingWrites
  }), [tagsFinal, tagsMap, loading, hasPendingWrites]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
};

/**
 * Hook to consume the reference/tag data context.
 */
export const useReferenceContext = () => useContext(ReferenceContext);

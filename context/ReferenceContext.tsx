'use client';

import React, { createContext, useContext, useMemo, useEffect, PropsWithChildren } from 'react';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Tag } from '@/types';
import { TagService } from '@/services/TagService';

interface ReferenceContextType {
  tags: Tag[];
  loading: boolean;
}

const ReferenceContext = createContext<ReferenceContextType>({ tags: [], loading: true });

export const ReferenceProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: tags, loading } = useFirestoreCollection<Tag>('tags');

  // Initialize default tags if missing (moved from DataContext)
  useEffect(() => {
    if (!loading && tags.length === 0) {
        TagService.getInstance().initializeDefaultsIfEmpty();
    }
  }, [loading, tags.length]);

  const value = useMemo(() => ({ tags, loading }), [tags, loading]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
};

export const useReferenceContext = () => useContext(ReferenceContext);

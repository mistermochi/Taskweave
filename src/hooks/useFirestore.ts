'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getFirestore,
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint,
  doc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to retrieve the current authenticated Firebase user ID.
 * Automatically updates when the auth state changes.
 *
 * @returns The UID string or null if not authenticated.
 */
export const useUserId = () => {
  const [uid, setUid] = useState<string | null>(null);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return unsubscribe;
  }, []);

  return uid;
};

/**
 * Generic hook for subscribing to a Firestore sub-collection for the current user.
 *
 * @template T - The type of the data stored in the collection.
 * @param collectionName - The name of the collection under the user document.
 * @param constraints - Array of Firestore query constraints (orderBy, where, etc).
 * @param enabled - Whether the subscription should be active.
 * @returns Object containing the data array and loading state.
 *
 * @example
 * const { data: tasks } = useFirestoreCollection<TaskEntity>('tasks', [orderBy('createdAt')]);
 */
export function useFirestoreCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
): { data: T[]; loading: boolean } {
  const uid = useUserId();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraintsStr = JSON.stringify(constraints.map(c => (c as any)._queryOptions || c.type));
  const constraintsRef = useRef(constraints);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (constraintsStr !== JSON.stringify(constraintsRef.current.map(c => (c as any)._queryOptions || c.type))) {
    constraintsRef.current = constraints;
  }

  useEffect(() => {
    if (!uid || !enabled) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    const db = getFirestore();
    const collectionRef = collection(db, 'users', uid, collectionName);
    const q = query(collectionRef, ...constraintsRef.current);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id } as unknown as T);
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid, collectionName, constraintsStr, enabled]);

  return { data, loading };
}

/**
 * Generic hook for subscribing to a single Firestore document for the current user.
 *
 * @template T - The type of the document data.
 * @param collectionName - The name of the parent sub-collection.
 * @param docId - The unique ID of the document to fetch.
 * @returns Object containing the document data or null, and loading state.
 */
export function useFirestoreDoc<T>(collectionName: string, docId: string | undefined): { data: T | null; loading: boolean } {
  const uid = useUserId();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || !docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getFirestore();
    const docRef = doc(db, 'users', uid, collectionName, docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid, collectionName, docId]);

  return { data, loading };
}

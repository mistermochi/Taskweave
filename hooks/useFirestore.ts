
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint,
  doc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

// Hook to ensure we have a user ID before querying
export const useUserId = () => {
  const [uid, setUid] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return unsubscribe;
  }, []);

  return uid;
};

// Generic hook to fetch a user-specific collection in real-time
export function useFirestoreCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
): { data: T[]; loading: boolean } {
  const uid = useUserId();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  
  const constraintsStr = JSON.stringify(constraints.map(c => (c as any)._queryOptions || c.type));
  const constraintsRef = useRef(constraints);

  if (constraintsStr !== JSON.stringify(constraintsRef.current.map(c => (c as any)._queryOptions || c.type))) {
    constraintsRef.current = constraints;
  }

  useEffect(() => {
    if (!uid || !enabled) {
      setLoading(false);
      setData([]); // Clear data if not enabled or no user
      return;
    }

    setLoading(true);
    // Path: users/{uid}/{collectionName}
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

// Generic hook to fetch a single user-specific document
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
    // Path: users/{uid}/{collectionName}/{docId}
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

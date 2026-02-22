'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { ContextService } from '@/services/ContextService';
import { LoadingScreen } from '@/components/ui/Feedback';
import LoginView from '@/views/LoginView';
import { AppProvider } from '@/context/AppProvider';
import { AppContent } from '@/components/AppContent';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      });
    }
    // --- END PWA Registration ---

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            ContextService.getInstance().setUserId(user.uid);

            const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
            const settingsSnap = await getDoc(settingsRef);
            const currentSettings = settingsSnap.data() || {};

            // --- ONE-TIME DATA MIGRATION ---
            if (!currentSettings.migration_v1_complete) {
                setLoadingText('Migrating data...');
                try {
                    console.log("Starting one-time data migration...");
                    const collectionsToMigrate = ['tasks', 'tags', 'vitals', 'activityLogs'];
                    const batch = writeBatch(db);

                    for (const collectionName of collectionsToMigrate) {
                        const oldColRef = collection(db, collectionName);
                        const oldDocsSnap = await getDocs(oldColRef);
                        
                        if (!oldDocsSnap.empty) {
                            console.log(`Migrating ${oldDocsSnap.size} documents from '${collectionName}'...`);
                            oldDocsSnap.forEach(oldDoc => {
                                const newDocRef = doc(db, 'users', user.uid, collectionName, oldDoc.id);
                                batch.set(newDocRef, oldDoc.data());
                            });
                        }
                    }

                    // Mark migration as complete
                    batch.set(settingsRef, { migration_v1_complete: true }, { merge: true });
                    
                    await batch.commit();
                    console.log("Data migration complete.");
                } catch (e) {
                    console.error("Data migration failed:", e);
                    // Don't block the user if migration fails, but log it.
                }
            }

            // --- Sync Profile on Login ---
            try {
                const updates: any = {};
                const newName = user.displayName?.split(' ')[0];

                if (newName && (!settingsSnap.exists() || currentSettings.displayName === 'Traveler')) {
                    updates.displayName = newName;
                }
                if (user.photoURL && (!settingsSnap.exists() || !currentSettings.photoURL)) {
                    updates.photoURL = user.photoURL;
                }
                
                if (Object.keys(updates).length > 0) {
                    await setDoc(settingsRef, updates, { merge: true });
                }
            } catch (e) {
                console.error("Failed to sync user profile", e);
            }

            setUser(user);
        } else {
            ContextService.getInstance().setUserId(null);
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
      return <LoadingScreen text={loadingText} />;
  }

  if (!user) {
      return <LoginView />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

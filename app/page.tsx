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

/**
 * The main entry page for the Focus Flow application.
 * It handles the top-level application lifecycle, including:
 * - Service Worker registration for PWA capabilities.
 * - Firebase Authentication state monitoring.
 * - One-time data migration for versioning and user-scoping.
 * - User profile synchronization on login.
 *
 * @logic
 * This component acts as the application's "Bootstrapper". It ensures all
 * required data and sensors are initialized before rendering the `AppContent`.
 */
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    /**
     * Registers the Service Worker for offline and PWA support.
     */
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration.scope);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      } else {
        console.warn('Service Workers not supported');
      }
    };
    
    registerSW();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            ContextService.getInstance().setUserId(user.uid);

            const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
            const settingsSnap = await getDoc(settingsRef);
            const currentSettings = settingsSnap.data() || {};

            /**
             * ONE-TIME DATA MIGRATION Logic.
             * If the user hasn't been migrated to the scoped structure,
             * it moves global tasks/tags into their specific user document.
             */
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

                    batch.set(settingsRef, { migration_v1_complete: true }, { merge: true });
                    
                    await batch.commit();
                    console.log("Data migration complete.");
                } catch (e) {
                    console.error("Data migration failed:", e);
                }
            }

            /**
             * Profile Synchronization.
             * Updates the user's display name and photo from their Google Auth profile
             * if they haven't set a custom one yet.
             */
            try {
                const updates: Record<string, unknown> = {};
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

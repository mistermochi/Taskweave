'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/shared/api/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { contextApi } from '@/entities/context';
import { LoadingScreen } from '@/shared/ui/ui/Feedback';
import LoginView from '@/views/LoginView';
import { AppProvider } from '@/context/AppProvider';
import { TaskApp } from "@/features/task-app/components/task-app";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { TaskEntity } from "@/entities/task";
import { Tag } from "@/entities/tag";

/**
 * Main Content component that handles data fetching and renders the TaskApp.
 */
function MainContent() {
  const defaultLayout = [20, 32, 48];
  const defaultCollapsed = false;
  const { data: tasks, loading: tasksLoading, hasPendingWrites: tasksPending } = useFirestoreCollection<TaskEntity>("tasks");
  const { data: tags, loading: tagsLoading, hasPendingWrites: tagsPending } = useFirestoreCollection<Tag>("tags");

  if (tasksLoading || tagsLoading) {
      return <LoadingScreen text="Loading your workspace..." />;
  }

  return (
    <div className="h-screen rounded-md border bg-background text-foreground">
      <TaskApp
        tasks={tasks}
        tags={tags}
        defaultLayout={defaultLayout}
        defaultCollapsed={defaultCollapsed}
        navCollapsedSize={4}
        hasPendingWrites={tasksPending || tagsPending}
      />
    </div>
  );
}

/**
 * The main entry page for the Focus Flow application.
 */
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            contextApi.setUserId(user.uid);

            const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
            const settingsSnap = await getDoc(settingsRef);
            const currentSettings = settingsSnap.data() || {};

            if (!currentSettings.migration_v1_complete) {
                setLoadingText('Migrating data...');
                try {
                    const collectionsToMigrate = ['tasks', 'tags', 'vitals', 'activityLogs'];
                    const batch = writeBatch(db);

                    for (const collectionName of collectionsToMigrate) {
                        const oldColRef = collection(db, collectionName);
                        const oldDocsSnap = await getDocs(oldColRef);

                        if (!oldDocsSnap.empty) {
                            oldDocsSnap.forEach(oldDoc => {
                                const newDocRef = doc(db, 'users', user.uid, collectionName, oldDoc.id);
                                batch.set(newDocRef, oldDoc.data());
                            });
                        }
                    }

                    batch.set(settingsRef, { migration_v1_complete: true }, { merge: true });
                    await batch.commit();
                } catch (e) {
                    console.error("Data migration failed:", e);
                }
            }

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
            contextApi.setUserId(null);
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
      <MainContent />
    </AppProvider>
  );
};

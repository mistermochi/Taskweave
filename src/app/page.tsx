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
 * Background manager for user-specific initialization tasks like
 * data migration and profile synchronization.
 */
function UserSessionManager({ user }: { user: User }) {
  useEffect(() => {
    const runBackgroundTasks = async () => {
      const migrationKey = `migration_v1_complete_${user.uid}`;
      const isMigrationDone = typeof window !== 'undefined' && localStorage.getItem(migrationKey) === 'true';

      if (isMigrationDone) return;

      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        const currentSettings = settingsSnap.data() || {};

        if (!currentSettings.migration_v1_complete) {
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
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(migrationKey, 'true');
        }

        // Sync profile
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
        console.error("Background tasks failed:", e);
      }
    };

    runBackgroundTasks();
  }, [user]);

  return null;
}

/**
 * Main Content component that handles data fetching and renders the TaskApp.
 */
function MainContent({
  authLoading,
  user
}: {
  authLoading: boolean;
  user: User | null
}) {
  const defaultLayout = [20, 32, 48];
  const defaultCollapsed = false;
  const { data: tasks, loading: tasksLoading, hasPendingWrites: tasksPending } = useFirestoreCollection<TaskEntity>("tasks", [], !!user);
  const { data: tags, loading: tagsLoading, hasPendingWrites: tagsPending } = useFirestoreCollection<Tag>("tags", [], !!user);

  // If auth is done and no user, the parent will show LoginView.
  // This component handles the rendering of the TaskApp shell.
  return (
    <div className="h-screen rounded-md border bg-background text-foreground">
      <TaskApp
        tasks={tasks}
        tags={tags}
        tasksLoading={authLoading || tasksLoading}
        tagsLoading={authLoading || tagsLoading}
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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        contextApi.setUserId(user.uid);
        setUser(user);
      } else {
        contextApi.setUserId(null);
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // If authentication is finished and no user is found, show login.
  if (!authLoading && !user) {
      return <LoginView />;
  }

  // Otherwise, render the App shell immediately.
  // If authLoading is true, MainContent will show skeletons.
  return (
    <AppProvider>
      {user && <UserSessionManager user={user} />}
      <MainContent authLoading={authLoading} user={user} />
    </AppProvider>
  );
};

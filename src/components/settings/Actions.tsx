import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/shared/api/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, Check, LogOut } from 'lucide-react';
import { useEnvironment } from '@/context/EnvironmentContext';

/**
 * Component for global account actions and debug tools.
 * Includes Logout functionality and data migration verification (development only).
 *
 * @component
 */
export const Actions: React.FC = () => {
  const { isDevelopment } = useEnvironment();
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Logs the current user out of the application.
   */
  const handleSignOut = async () => {
    await signOut(auth);
  };

  /**
   * DEBUG ONLY: Verifies that data has been successfully migrated from
   * root-level collections to user-scoped sub-collections.
   */
  const handleVerifyMigration = async () => {
    if (!auth.currentUser) {
        alert("User not found. Please sign in again.");
        return;
    }
    setIsVerifying(true);

    const uid = auth.currentUser.uid;
    const collectionsToCompare = ['tasks', 'tags', 'vitals', 'activityLogs'];
    let results: string[] = [];
    let isSuccess = true;

    try {
        for (const collectionName of collectionsToCompare) {
            const oldColRef = collection(db, collectionName);
            const newColRef = collection(db, 'users', uid, collectionName);

            const [oldDocsSnap, newDocsSnap] = await Promise.all([
                getDocs(oldColRef),
                getDocs(newColRef)
            ]);

            const oldDocsCount = oldDocsSnap.size;
            const newDocsCount = newDocsSnap.size;

            const match = oldDocsCount === newDocsCount;
            if (!match) {
                isSuccess = false;
            }

            results.push(`${collectionName}: ${match ? '✅' : '❌'} (Old: ${oldDocsCount}, New: ${newDocsCount})`);
        }

        const finalMessage = `Migration Verification:\n\n${results.join('\n')}\n\nOverall: ${isSuccess ? 'Success! All data migrated correctly.' : 'Mismatch detected. Some data may be missing.'}`;
        alert(finalMessage);

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Migration verification failed:", error);
        alert(`An error occurred during verification: ${error.message}`);
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Debug Tools */}
      {isDevelopment && (
          <div className="text-center mb-4 p-4 rounded-xl bg-surface border border-border space-y-3">
              <span className="text-xxs font-mono uppercase tracking-widest text-secondary/40 bg-foreground/5 px-2 py-1 rounded">
                  Debug Mode
              </span>
              <button
                  onClick={handleVerifyMigration}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-xs rounded-lg border border-blue-500/20 transition-colors disabled:opacity-50"
              >
                  {isVerifying ? (
                      <><Loader2 size={14} className="animate-spin" /> Verifying Migration...</>
                  ) : (
                      <><Check size={14} /> Verify Data Migration</>
                  )}
              </button>
          </div>
      )}
      {/* Primary Actions */}
      <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-colors"
      >
          <LogOut size={16} />
          <span>Sign Out</span>
      </button>
  </div>
  );
}

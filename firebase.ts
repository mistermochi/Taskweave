
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDlwY6k9SjlKzE6ioj1G-istyMWwZyJvoA",
  authDomain: "vitality-7396e.firebaseapp.com",
  projectId: "vitality-7396e",
  storageBucket: "vitality-7396e.firebasestorage.app",
  messagingSenderId: "953062308598",
  appId: "1:953062308598:web:f093f14966e8d438e58ad7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);


// Enable persistence to allow offline access and faster initialization
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence.
      console.warn('Firestore persistence is not available in this browser.');
    }
  });

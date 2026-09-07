import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Critical: export firestore with exact firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };

export interface FirebaseSyncPayload {
  childrenCount: number;
  checkedInCount: number;
  safetyTasksCount: number;
  lastAction?: string;
  syncedBy?: string;
}

/**
 * Pushes local daycare state snapshot to Firebase Firestore and returns exact sync moment.
 */
export async function pushLocalStateToFirebase(payload: FirebaseSyncPayload): Promise<{ success: boolean; timestamp: string; formattedTime: string }> {
  const now = new Date();
  const timestampIso = now.toISOString();
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  try {
    const syncDocRef = doc(db, 'syncState', 'latest_kiosk_sync');
    await setDoc(syncDocRef, {
      id: 'latest_kiosk_sync',
      timestamp: timestampIso,
      clientLocalTime: formattedTime,
      childrenCount: payload.childrenCount,
      checkedInCount: payload.checkedInCount,
      safetyTasksCount: payload.safetyTasksCount,
      lastAction: payload.lastAction || 'Local state push',
      syncedBy: payload.syncedBy || 'Clara Oswald',
      firebaseSyncedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true, timestamp: timestampIso, formattedTime };
  } catch (error: any) {
    console.warn('Firestore direct sync notice:', error);
    // If offline, still return the timestamp moment attempted
    return { success: false, timestamp: timestampIso, formattedTime };
  }
}

// Connection test helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore client is offline. Check connection or config.');
      return false;
    }
    // Expected if doc doesn't exist, which confirms connection to the cluster
    return true;
  }
}

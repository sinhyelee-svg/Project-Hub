import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { VideoItem } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyAHMzp8YDFfPm_K9dU-TyL1uY2BWJq5iPQ",
  authDomain: "alien-legacy-441007-i6.firebaseapp.com",
  projectId: "alien-legacy-441007-i6",
  storageBucket: "alien-legacy-441007-i6.firebasestorage.app",
  messagingSenderId: "866552262254",
  appId: "1:866552262254:web:fb966fd83b24724488007f"
};

const app = initializeApp(firebaseConfig);

// Initialize with the custom databaseId specified in firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-campaignvideotim-dddca6fe-5c6a-4956-bb99-b1c9abc63704");

const COLLECTION_NAME = 'videos';

// Error reporting for automated rules adjustment and diagnostics
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sync listener for real-time updates
export const subscribeToVideos = (
  onUpdate: (videos: VideoItem[]) => void,
  initialVideosFallback: VideoItem[]
) => {
  const colRef = collection(db, COLLECTION_NAME);
  
  return onSnapshot(colRef, async (snapshot) => {
    try {
      if (snapshot.empty) {
        // If Firestore database is brand new and empty, seed it with initial fallback data
        console.log('Firestore is empty. Seeding database with initial videos...');
        const batch = writeBatch(db);
        initialVideosFallback.forEach((video) => {
          const docRef = doc(db, COLLECTION_NAME, video.id);
          batch.set(docRef, video);
        });
        await batch.commit();
        // The onSnapshot will automatically trigger again when the batch writes complete.
      } else {
        const videosList: VideoItem[] = [];
        snapshot.forEach((doc) => {
          videosList.push(doc.data() as VideoItem);
        });
        // Sort by 'no' to keep the correct spreadsheet-like order
        videosList.sort((a, b) => a.no - b.no);
        onUpdate(videosList);
      }
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, COLLECTION_NAME);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
  });
};

// Create or update a single video
export const saveVideoToFirestore = async (video: VideoItem) => {
  const path = `${COLLECTION_NAME}/${video.id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, video.id);
    await setDoc(docRef, video);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Batch save multiple videos (useful for re-indexing, importing, resetting, range updates)
export const saveVideosToFirestoreBatch = async (videos: VideoItem[]) => {
  try {
    const batch = writeBatch(db);
    videos.forEach((video) => {
      const docRef = doc(db, COLLECTION_NAME, video.id);
      batch.set(docRef, video);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

// Delete a single video
export const deleteVideoFromFirestore = async (videoId: string) => {
  const path = `${COLLECTION_NAME}/${videoId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, videoId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Batch delete and re-set all videos (useful for reset or full imports)
export const resetVideosInFirestore = async (newVideos: VideoItem[]) => {
  try {
    // 1. Get all current docs and delete them
    const colRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    // 2. Set new videos
    const writeBatchInstance = writeBatch(db);
    newVideos.forEach((video) => {
      const docRef = doc(db, COLLECTION_NAME, video.id);
      writeBatchInstance.set(docRef, video);
    });
    await writeBatchInstance.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

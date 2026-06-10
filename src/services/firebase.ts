import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("Firebase Config Check:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey
    ? "PRESENT (Starts with " + firebaseConfig.apiKey.slice(0, 5) + ")"
    : "MISSING",
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// In a real app, persistence should be enabled to support offline batching
/*
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn("Multiple tabs open, persistence disabled");
    } else if (err.code == "unimplemented") {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Persistence not supported");
    }
  });
}
*/

export const signIn = async () => {
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (e) {
    console.error("Anonymous auth failed", e);
    throw e;
  }
};

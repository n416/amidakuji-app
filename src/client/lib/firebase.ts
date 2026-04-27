import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export const initFirebase = async () => {
  if (getApps().length === 0) {
    const res = await fetch('/api/config');
    const config = await res.json() as any;
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
  return { app, db, auth };
};

export const getFirebaseInstance = () => {
  if (!app) throw new Error("Firebase not initialized");
  return { app, db, auth };
};

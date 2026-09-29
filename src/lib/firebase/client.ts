"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserSessionPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";

import { isFirebaseConfigured, publicEnv } from "@/config/public-env";

let authInstance: Auth | undefined;
let persistenceReady: Promise<void> | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Check the NEXT_PUBLIC_FIREBASE_* variables.");
  }
  return getApps().length > 0 ? getApp() : initializeApp(publicEnv.firebase);
}

/**
 * The browser only needs a Firebase session long enough to finish sign-in and email
 * verification. Session persistence keeps it for the lifetime of the tab, and the real
 * session lives in our httpOnly cookie.
 */
export async function getFirebaseAuth(): Promise<Auth> {
  authInstance ??= getAuth(getFirebaseApp());
  persistenceReady ??= setPersistence(authInstance, browserSessionPersistence);
  await persistenceReady;
  return authInstance;
}

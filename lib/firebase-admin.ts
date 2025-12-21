import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY
);

if (isConfigured && getApps().length === 0) {
  try {
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    adminAuth = getAuth(adminApp);
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else if (getApps().length > 0) {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
}

export async function verifyIdToken(token: string): Promise<{ uid: string; email?: string } | null> {
  if (!adminAuth) {
    return null;
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export { adminAuth, isConfigured as isAdminConfigured };

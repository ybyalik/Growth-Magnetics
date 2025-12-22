// @refresh reset
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthChange, signInWithGoogle, signOut, isConfigured, auth } from "./firebase";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface DbUser {
  id: number;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: "user" | "admin";
  credits: number;
  status: "active" | "suspended";
}

interface AuthContextType {
  user: AuthUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };
      setUser(authUser);

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDbUser(data.user);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    } else {
      setUser(null);
      setDbUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthChange(syncUser);
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!isConfigured) {
      throw new Error("Firebase is not configured");
    }
    try {
      const firebaseUser = await signInWithGoogle();
      await syncUser(firebaseUser);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut();
      setUser(null);
      setDbUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDbUser(data.user);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, isFirebaseConfigured: isConfigured, signIn, logOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { ADMIN_DEPARTMENTS } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AppUser extends User {
  isAdmin: boolean;
  isStoreAdmin: boolean;
}

interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  appUser: AppUser | null;
  loading: boolean;
  forceRefreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirestoreUserToAppUser = (firestoreData: User, uid: string): AppUser => {
  const isAdmin = firestoreData.role === 'admin';
  // isStoreAdmin is true if the user is an admin BUT their department is NOT an admin department
  const isStoreAdmin = isAdmin && !ADMIN_DEPARTMENTS.includes(firestoreData.department);

  return {
    ...firestoreData,
    id: uid,
    isAdmin,
    isStoreAdmin,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const forceRefreshUser = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data() as User;
          setAppUser(mapFirestoreUserToAppUser(firestoreData, user.uid));
        } else {
          setAppUser(null);
        }
      } catch (error) {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setAppUser(null);
      }
    } else {
      setAppUser(null);
    }
  }, [auth]);

  useEffect(() => {
    let unsubscribeFirestore: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      // Unsubscribe from previous user's snapshot listener
      unsubscribeFirestore();

      setFirebaseUser(user);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data() as User;
            setAppUser(mapFirestoreUserToAppUser(firestoreData, user.uid));
          } else {
            // User exists in Auth but not in Firestore. This can happen after deletion.
            setAppUser(null);
            console.warn("User exists in Auth, but not in Firestore.");
          }
          setLoading(false);
        }, (error) => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
          setAppUser(null);
          setLoading(false);
        });
      } else {
        // No user, clear app user and finish loading
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, [auth]);


  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, forceRefreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

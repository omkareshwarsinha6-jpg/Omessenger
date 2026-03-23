import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time user data (important for ban status, admin status)
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          } else {
            // Create new user if doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${firebaseUser.uid.slice(0, 5)}`,
              email: firebaseUser.email || '',
              avatarURL: firebaseUser.photoURL || '',
              isOnline: true,
              lastSeen: Timestamp.now(),
              isAdmin: false,
              isBanned: false,
              createdAt: Timestamp.now(),
            };
            setDoc(userDocRef, newUser);
            setUser(newUser);
          }
          setLoading(false);
        }, (err) => {
          console.error("User snapshot error:", err);
          setError(err.message);
          setLoading(false);
        });

        return () => unsubUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { isOnline: false, lastSeen: Timestamp.now() }, { merge: true });
      }
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { user, loading, error, loginWithGoogle, logout };
};

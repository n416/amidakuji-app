import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { initFirebase } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribe: any;
    
    const setupFirebase = async () => {
      try {
        const { auth } = await initFirebase();
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const meRes = await fetch('/api/user/me', { credentials: 'include' });
              if (meRes.ok) {
                const userData = await meRes.json();
                dispatch(setUser(userData));
              } else {
                dispatch(setUser({ uid: firebaseUser.uid }));
              }
            } catch (e) {
              console.error('Failed to load user info:', e);
              dispatch(setUser({ uid: firebaseUser.uid }));
            }
          } else {
            dispatch(setUser(null));
          }
        });
      } catch (e) {
        console.error('Firebase setup failed', e);
      }
    };

    setupFirebase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};

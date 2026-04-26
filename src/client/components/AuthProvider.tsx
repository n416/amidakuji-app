import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setLoading } from '../store/authSlice';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribe: any;
    
    const checkFirebaseAndSubscribe = () => {
      const fb = (window as any).firebase;
      if (fb && fb.apps && fb.apps.length > 0) {
        unsubscribe = fb.auth().onAuthStateChanged(async (firebaseUser: any) => {
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
      } else {
        // Firebase is not initialized yet, wait and try again
        setTimeout(checkFirebaseAndSubscribe, 100);
      }
    };

    checkFirebaseAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};

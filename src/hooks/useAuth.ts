'use client';
import { useState, useEffect } from 'react';
import {
  getStoredRole,
  getStoredToken,
  subscribeAuthChange,
} from '@/lib/auth-storage';

export function useAuth() {
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncAuth = async () => {
      if (active) {
        setLoading(true);
      }
      const [storedRole, storedToken] = await Promise.all([getStoredRole(), getStoredToken()]);
      if (!active) return;
      setRole(storedRole?.toLowerCase() || null);
      setToken(storedToken);
      setLoading(false);
    };

    void syncAuth();

    const unsubscribe = subscribeAuthChange(() => {
      void syncAuth();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { role, token, loading };
}

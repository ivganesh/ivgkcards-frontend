'use client';

import { useEffect, useState } from 'react';

import { authStorage } from '@/lib/auth-storage';
import type { AuthUser } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setUser(authStorage.getUser());
      setIsLoading(false);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return { user, isLoading };
}


'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { DEMO_USERS, type DemoRole } from '@/lib/demo';

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      const existingToken = getCookie('accessToken');

      // If a demo token is present, restore from it instead of calling the backend
      if (existingToken?.endsWith('.demo-signature')) {
        try {
          const payload = JSON.parse(atob(existingToken.split('.')[1]));
          const role = payload.role as DemoRole;
          if (DEMO_USERS[role]) {
            setAuth(DEMO_USERS[role], existingToken);
            return;
          }
        } catch { /* fall through to real refresh */ }
      }

      try {
        const { data } = await api.post('/auth/refresh');
        const { accessToken, user } = data.data;
        setAuth(user, accessToken);
        document.cookie = `userRole=${user.role}; path=/; SameSite=Lax`;
      } catch {
        clearAuth();
      }
    }

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api/client';
import type { UserView } from '@/lib/api/types';

export interface SessionContextValue {
  user: UserView | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [user, setUser] = useState<UserView | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const me = await api.get<UserView>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get<UserView>('/auth/me')
      .then((me) => {
        if (active) {
          setUser(me);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, loading, refresh: load }),
    [user, loading, load],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

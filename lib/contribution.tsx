import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth';
import type { RestroomDraft } from '@/lib/types';

// Lets people fill a contribution form while logged out; the sign-in gate happens
// at submit. We stash the in-progress draft here, send them to sign in, then bring
// them back to the form with everything intact once they're authenticated.

type Pending = { kind: 'restroom'; draft: RestroomDraft } | null;

type Ctx = {
  stashRestroom: (draft: RestroomDraft) => void;
  takeRestroom: () => RestroomDraft | null;
  clear: () => void;
};

const ContributionContext = createContext<Ctx | undefined>(undefined);

export function ContributionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [pending, setPending] = useState<Pending>(null);
  const resumed = useRef(false);

  // When they sign in with a pending contribution, return them to its form.
  useEffect(() => {
    if (!session) {
      resumed.current = false;
      return;
    }
    if (pending && !resumed.current) {
      resumed.current = true;
      if (pending.kind === 'restroom') router.navigate('/restroom/new');
    }
  }, [session, pending]);

  const value: Ctx = {
    stashRestroom: (draft) => setPending({ kind: 'restroom', draft }),
    takeRestroom: () => {
      if (pending?.kind === 'restroom') {
        const d = pending.draft;
        setPending(null);
        return d;
      }
      return null;
    },
    clear: () => setPending(null),
  };

  return <ContributionContext.Provider value={value}>{children}</ContributionContext.Provider>;
}

export function useContribution() {
  const ctx = useContext(ContributionContext);
  if (!ctx) throw new Error('useContribution must be used within ContributionProvider');
  return ctx;
}

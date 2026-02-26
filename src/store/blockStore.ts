import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BlockedApp, AccessGrant } from '@/types/blocking';

interface BlockState {
  blockedApps: BlockedApp[];
  accessGrants: Record<string, AccessGrant>; // packageName → grant
  isMonitoring: boolean;

  addBlockedApp: (app: BlockedApp) => void;
  removeBlockedApp: (packageName: string) => void;
  isBlocked: (packageName: string) => boolean;
  grantAccess: (grant: AccessGrant) => void;
  isAccessGranted: (packageName: string) => boolean;
  setMonitoring: (v: boolean) => void;
  pruneExpiredGrants: () => void;
}

export const useBlockStore = create<BlockState>()(
  persist(
    (set, get) => ({
      blockedApps: [],
      accessGrants: {},
      isMonitoring: false,

      addBlockedApp: (app) =>
        set((s) => ({
          blockedApps: s.blockedApps.some((a) => a.packageName === app.packageName)
            ? s.blockedApps
            : [...s.blockedApps, app],
        })),

      removeBlockedApp: (packageName) =>
        set((s) => ({
          blockedApps: s.blockedApps.filter((a) => a.packageName !== packageName),
        })),

      isBlocked: (packageName) =>
        get().blockedApps.some((a) => a.packageName === packageName),

      grantAccess: (grant) =>
        set((s) => ({ accessGrants: { ...s.accessGrants, [grant.packageName]: grant } })),

      isAccessGranted: (packageName) => {
        const grant = get().accessGrants[packageName];
        return !!grant && grant.expiresAt > Date.now();
      },

      setMonitoring: (v) => set({ isMonitoring: v }),

      pruneExpiredGrants: () => {
        const now = Date.now();
        set((s) => {
          const grants = { ...s.accessGrants };
          for (const pkg of Object.keys(grants)) {
            if (grants[pkg].expiresAt <= now) delete grants[pkg];
          }
          return { accessGrants: grants };
        });
      },
    }),
    {
      name: 'block-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

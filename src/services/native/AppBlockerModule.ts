import { NativeModules, Platform } from 'react-native';
import type { InstalledApp } from '@/types/blocking';

const Native = NativeModules.AppBlockerModule;

const stub = (name: string) => {
  console.warn(`AppBlockerModule.${name} is not available on this platform`);
};

export const AppBlockerModule = {
  getInstalledApps: (): Promise<InstalledApp[]> => {
    if (Platform.OS !== 'android' || !Native) return Promise.resolve([]);
    return Native.getInstalledApps();
  },

  hasUsageStatsPermission: (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !Native) return Promise.resolve(false);
    return Native.hasUsageStatsPermission();
  },

  requestUsageStatsPermission: (): void => {
    if (Platform.OS !== 'android' || !Native) { stub('requestUsageStatsPermission'); return; }
    Native.requestUsageStatsPermission();
  },

  hasOverlayPermission: (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !Native) return Promise.resolve(false);
    return Native.hasOverlayPermission();
  },

  requestOverlayPermission: (): void => {
    if (Platform.OS !== 'android' || !Native) { stub('requestOverlayPermission'); return; }
    Native.requestOverlayPermission();
  },

  startMonitorService: (blockedPackageNames: string[]): void => {
    if (Platform.OS !== 'android' || !Native) { stub('startMonitorService'); return; }
    Native.startMonitorService(JSON.stringify(blockedPackageNames));
  },

  stopMonitorService: (): void => {
    if (Platform.OS !== 'android' || !Native) { stub('stopMonitorService'); return; }
    Native.stopMonitorService();
  },

  updateBlockedApps: (blockedPackageNames: string[]): void => {
    if (Platform.OS !== 'android' || !Native) return;
    Native.updateBlockedApps(JSON.stringify(blockedPackageNames));
  },

  grantAppAccess: (packageName: string, expiresAt: number): void => {
    if (Platform.OS !== 'android' || !Native) return;
    Native.grantAppAccess(packageName, expiresAt);
  },
};
